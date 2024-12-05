import { Chart } from "📚/chart/mod.ts";
import { nextDate, range } from "📚/time/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";

/** MACD Strategy */
export class MACD {
  private readonly fast: Chart;
  private readonly slow: Chart;
  private readonly macd_line: Chart;
  private readonly trigger_line: Chart;
  private readonly start: DateFormat;
  private readonly end: DateFormat;

  constructor(
    private readonly chart: Chart,
    fastWindow: number = 12,
    slowWindow: number = 26,
    triggerWindow: number = 9,
  ) {
    this.slow = chart.ema(slowWindow);
    this.fast = chart.ema(fastWindow);
    this.macd_line = this.fast.subtract(this.slow);
    this.trigger_line = this.macd_line.ema(triggerWindow);

    this.start = nextDate(this.trigger_line.start);
    this.end = chart.end;
  }

  /** Trading trigger on date */
  public value(date: DateFormat): number {
    //console.log('cross-path value on date', date);
    const prev: DateFormat = nextDate(date, -1);

    const t: number = this.trigger_line.value(date);
    const t1: number = this.trigger_line.value(prev);
    const m: number = this.macd_line.value(date);

    // trigger line have crossed 0 and MACD line is already above 0
    const triggerUp: boolean = t > 0 && t1 <= 0 && m > 0;
    const triggerDown: boolean = t < 0 && t1 >= 0 && m < 0;

    if (triggerUp) return 1;
    if (triggerDown) return -1;
    return 0;
  }

  public get dates(): DateFormat[] {
    return range(this.start, this.end);
  }

  /** All trading triggers */
  public get values(): number[] {
    return this.dates.map((date) => this.value(date));
  }
}

/** Define boundaries of parameters for MACD Strategy */
export type Parameter = "fast" | "slow" | "trigger";

export class MACDParameters {
  public readonly names: Parameter[] = ["fast", "slow", "trigger"];
  private readonly min = 2;
  private readonly max = 200;

  constructor(
    public readonly fast = 12,
    public readonly slow = 26,
    public readonly trigger = 9,
  ) {}

  /** Values as vector */
  public get values(): [number, number, number] {
    return [this.fast, this.slow, this.trigger];
  }

  /** Min and max for parameter, fast must be less than slow and vice versa */
  public boundary(param: Parameter): { min: number; max: number } {
    if (param == "fast") return { min: this.trigger + 1, max: this.slow - 1 };
    if (param == "slow") return { min: this.fast + 1, max: this.max };
    if (param == "trigger") return { min: this.min, max: this.fast - 1 };
    return { min: NaN, max: NaN };
  }

  /** Pick a random value within boundary */
  public random(param: Parameter): number {
    const { min, max } = this.boundary(param);
    return min + Math.floor(Math.random() * (max - min));
  }

  /** Set parameter to value */
  public set(param: Parameter, value: number): MACDParameters {
    const b = this.boundary(param);
    const d = Math.round(value);
    let actual = d;
    if (d > b.max) actual = b.max;
    else if (d < b.min) actual = b.min;
    const p: number[] = this.names.map((name: Parameter) =>
      (name === param ? actual : this[name]) as number
    );
    return new MACDParameters(...p);
  }

  /** Change one parameter by amount */
  public step(param: Parameter, amount: number): MACDParameters {
    return this.set(param, this[param] + amount);
  }
}
