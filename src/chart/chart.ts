import { diffDate, nextDate } from "📚/time/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { std } from "📚/math/statistics.ts";
import { ema, rsi, sma } from "📚/chart/indicators.ts";

type Numbers = number[];

/** Numbers by date */
export class Chart {
  public readonly start: DateFormat;

  constructor(
    public readonly values: Numbers,
    public readonly end: DateFormat,
  ) {
    this.start = nextDate(this.end, -this.values.length + 1);
  }

  //////////////////////////////////////////////////////////////////////
  /// Lookup values
  //////////////////////////////////////////////////////////////////////

  /** List of all dates */
  public get dates(): DateFormat[] {
    const dates: DateFormat[] = [];
    let date = this.start;
    for (const _value of this.values) {
      dates.push(date);
      date = nextDate(date);
    }
    return dates;
  }

  /** Lookup value on date */
  public value(date: DateFormat): number {
    const index: number = diffDate(this.start, date);
    if (index < 0 || index >= this.values.length) {
      throw new Error(
        `Date not in range: ${this.start} < ${date} < ${this.end}`,
      );
    }
    return this.values[index];
  }

  public get first(): number {
    return this.values[0];
  }

  public get last(): number {
    return this.values[this.values.length - 1];
  }

  public get length(): number {
    return this.values.length;
  }

  //////////////////////////////////////////////////////////////////////
  /// Aggregate statistics
  //////////////////////////////////////////////////////////////////////

  /** Add all values together */
  public get sum(): number {
    return this.values.reduce((sum, a) => sum + a, 0);
  }

  /** Average of numbers */
  public get avg(): number {
    return this.sum / this.length;
  }

  /** Standard Deviation */
  public get std(): number {
    return std(this.values);
  }

  /** Ratio of gain from arbitrary date to another */
  public gain(start: DateFormat, end: DateFormat): number {
    const first: number = this.value(start);
    const last: number = this.value(end);
    const ratio = last / first - 1;
    return ratio;
  }

  /** Annual Yield */
  public get annual_return(): number {
    const years: number = (this.length - 1) / 365;
    const annual_return = (this.last / this.first) ** (1 / years) - 1;
    return annual_return;
  }

  /** Annual Standard Deviation */
  public get annual_standard_deviation(): number {
    return std(this.returns.values) * Math.sqrt(365);
  }

  /** Sharpe Ratio, riskfree is annual riskfree return, for example 0.05 */
  public sharpe_ratio(riskfree: number = 0.0): number {
    return (this.annual_return - riskfree) / this.annual_standard_deviation;
  }

  //////////////////////////////////////////////////////////////////////
  /// Derived Charts
  //////////////////////////////////////////////////////////////////////

  /** Create a derived chart, cache for future use */
  private readonly subcharts: Record<string, Chart> = {};
  private derive(
    values: Numbers,
    id: string,
    enddate: DateFormat = this.end,
  ): Chart {
    if (!(id in this.subcharts)) {
      this.subcharts[id] = new Chart(values, enddate);
    }
    return this.subcharts[id];
  }

  /** Sub chart with entries starting on date */
  public from(start: DateFormat): Chart {
    const offset: number = diffDate(this.start, start);
    const trimmed: Numbers = this.values.slice(offset);
    return this.derive(trimmed, "from" + start);
  }

  /** Sub chart with entries until and including date */
  public until(end: DateFormat): Chart {
    const count: number = diffDate(this.start, end);
    const trimmed: Numbers = this.values.slice(0, count + 1);
    return this.derive(trimmed, "until" + end, end);
  }

  /** Value as ratio above previous value */
  private get returns(): Chart {
    const v: Numbers = this.values;
    return this.derive(
      v.map((a, i) => (i == 0 ? 0 : a / v[i - 1] - 1)).slice(1),
      "win",
    );
  }

  /** Simple Moving Average */
  public sma(window: number): Chart {
    return this.derive(sma(this.values, window), "sma" + window);
  }

  /** Exponential Moving Average */
  public ema(window: number): Chart {
    return this.derive(ema(this.values, window), "ema" + window);
  }

  /** Relative Strength Index */
  public rsi(window: number): Chart {
    return this.derive(rsi(this.values, window), "rsi" + window);
  }

  /** this chart - other chart */
  public subtract(other: Chart): Chart {
    const start: DateFormat = this.start > other.start
      ? this.start
      : other.start;
    const end: DateFormat = this.end < other.end ? this.end : other.end;

    const parent = this.from(start).until(end).values;
    const child = other.from(start).until(end).values;
    const diff = parent.map((n, i) => n - child[i]);
    return new Chart(diff, end);
  }

  /** Trim leading 10000 (means not started) and trailing 6000 (means copy stopped) */
  public get trim(): Chart {
    // No trimming required
    if (
      this.value(nextDate(this.start)) != 10000 &&
      this.value(nextDate(this.end, -1)) != 6000
    ) return this;

    // Search for start
    let next: DateFormat = nextDate(this.start);
    while (this.value(next) == 10000) next = nextDate(next);
    const start = nextDate(next, -1);

    // Seach for end
    let prev: DateFormat = nextDate(this.end, -1);
    while (this.value(prev) == 6000) prev = nextDate(prev, -1);
    const end = nextDate(prev);

    const values = this.from(start).until(end).values;

    return this.derive(values, "trim", end);
  }
}
