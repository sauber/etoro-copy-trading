import { CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import { Community } from "📚/repository/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { diffDate } from "📚/time/mod.ts";
import { Chart } from "📚/chart/mod.ts";
import { MACD, MACDParameters } from "./macd.ts";
import type { Parameter } from "./cross-path.ts";
import { sum } from "📚/math/statistics.ts";

type Position = {
  date: DateFormat;
  value: number;
};

type Point = [number, number];

/** Randomly rearrange elements in an array */
function shuffle<T>(array: T[]): T[] {
  return [...array].sort((_a, _b) => Math.random() - 0.5);
}

/** Randomly pick elements from an array */
function sample<T>(array: T[], count = 1): T[] {
  return shuffle(array).slice(0, count);
}

/** Vector in any dimension */
class Vector {
  constructor(private readonly v: number[]) {}

  /** Create zero filled vector */
  public static zero(count: number): Vector {
    return new Vector(Array(count).fill(0));
  }

  /** Value at dimension */
  public value(index: number): number {
    return this.v[index];
  }

  /** Length */
  public get length(): number {
    return Math.sqrt(sum(this.v.map((v) => v * v)));
  }

  /** Adding vector */
  public add(w: Vector): Vector {
    return new Vector(this.v.map((n, i) => n + w.value(i)));
  }

  /** Scale vector to ratio */
  public scale(ratio: number): Vector {
    return new Vector(this.v.map((n) => n * ratio));
  }

  /** Set value at dimension */
  public set(index: number, value: number): Vector {
    return new Vector(this.v.map((n, i) => i === index ? value : n));
  }

  /** Vector as a printable string */
  public string(label = "v"): string {
    return label + "[" + this.v.map((n) => n.toFixed(3)).join(", ") + "]";
  }
}

/** Aquire the result of parameters */
function test([slow, fast, trigger]: [number, number, number]) {
  // Accumulated profit
  let acc = 0;
  let wins = 0;
  let losses = 0;
  const duration: Array<number> = [];

  /** Record results when closing position */
  function close(start: DateFormat, end: DateFormat, profit: number): void {
    acc += profit;
    if (profit > 0) ++wins;
    if (profit < 0) ++losses;
    duration.push(diffDate(start, end));
  }

  /** Loop all dates in random sample charts */
  // TODO: Use simulation
  const c: Chart[] = sample(charts, 20);
  c.forEach((chart, _index) => {
    let position: Position | null = null;
    // const strategy = new CrossPath(chart, fast, slow);
    const strategy = new MACD(chart, fast, slow, trigger);
    const dates: DateFormat[] = strategy.dates;
    dates.forEach((date: DateFormat) => {
      const signal: number = strategy.value(date);
      if (signal > 0 && !position) {
        // Have no position, so open one
        position = { date: date, value: 1000 * signal };
      } else if (signal < 0 && position) {
        // Close existing position, lose 2% on trade
        const profit = position.value *
          (chart.gain(position.date, date) - 0.01);
        close(position.date, date, profit);
        position = null;
      }
    });
  });

  return acc;
}

/** The sample with highe result */
function absolutePeak(samples: Point[]): Point {
  samples.sort((a, b) => b[1] - a[1]);
  return samples[0];
}

/** Sample points in one random dimension. Step towards peak. */
function findpeak(): void {
  // Initial values
  let params = new MACDParameters();
  let velocity = Vector.zero(params.names.length);
  const friction = 0.75;
  const sample = 10;

  while (true) {
    // Current point and result
    const point = params.values;
    const result: number = test(point);

    // Random dimension
    const index: number = Math.floor(Math.random() * point.length);
    const name = params.names[index] as Parameter;

    // Reduce velocity by friction
    let acceleration = Vector.zero(params.names.length);
    velocity = velocity.scale(friction);

    // When min and max are same cannot estimate new peak position
    const { min, max } = params.boundary(name);
    if (max > min) {
      // Samples at min, max and other random points
      const n = Array(sample).fill(0).map(() => params.random(name));
      n.push(min, max);
      const s = [...new Set(n)].sort((a, b) => a - b);
      const pairs: Point[] = s.map((x) => {
        const newPoint = params.set(name, x);
        const y: number = test(newPoint.values);
        return [x, y];
      });

      // Accelerate towards peak
      const peak = absolutePeak(pairs);
      acceleration = acceleration.set(index, (peak[0] - point[index]) * 0.1);
    }

    velocity = velocity.add(acceleration);

    // Take step towards peak.
    params.names.forEach((name, index) =>
      params = params.step(name, velocity.value(index))
    );

    // Display action
    console.log(
      point,
      result.toFixed(2),
      "=>",
      name,
      acceleration.string("a"),
      velocity.string("v"),
    );

    // Continue if velocity is high enough
    if (acceleration.length < 0.11 && velocity.length < 0.1) break;
  }
}

// Community Repo
const path: string = Deno.args[0];
const disk = new DiskBackend(path);
const repo = new CachingBackend(disk);
const community = new Community(repo);

// Load Charts
const t1: number = performance.now();
const charts = await community.allCharts();
const loadingTime: number = performance.now() - t1;
console.log("Loaded", charts.length, "charts in", loadingTime, "ms");

findpeak();
