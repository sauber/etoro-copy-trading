import { EMA, RSI, SMA } from "@debut/indicators";
import { type DateFormat, diffDate, nextDate } from "📚/time/mod.ts";
import { std } from "📚/math/statistics.ts";

// Series of numbers
type Numbers = number[];

// Function to calculate derived series and end date
type Derive = () => [series: Numbers, end: DateFormat];

/** Numbers by date */
export class Chart {
  public readonly start: DateFormat;
  public readonly first: number;
  public readonly last: number;

  constructor(
    public readonly values: Numbers,
    public readonly end: DateFormat,
  ) {
    this.start = nextDate(this.end, -this.values.length + 1);
    this.first = values[0];
    this.last = values[values.length - 1];
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
  private derive(derive: Derive, id: string): Chart {
    if (!(id in this.subcharts)) this.subcharts[id] = new Chart(...derive());
    return this.subcharts[id];
  }

  /** Sub chart with entries starting on date */
  public from(start: DateFormat): Chart {
    const calc: Derive =
      () => [this.values.slice(diffDate(this.start, start)), this.end];
    return this.derive(calc, "from" + start);
  }

  /** Sub chart with entries until and including date */
  public until(end: DateFormat): Chart {
    const calc: Derive =
      () => [this.values.slice(0, diffDate(this.start, end) + 1), end];
    return this.derive(calc, "until" + end);
  }

  /** Value as ratio above previous value */
  private get returns(): Chart {
    const v: Numbers = this.values;
    const calc: Derive = () => [
      v.map((a, i) => (i == 0 ? 0 : a / v[i - 1] - 1)).slice(1),
      this.end,
    ];
    return this.derive(calc, "win");
  }

  /** Run values through an indicator function */
  private indicator(fn: SMA | EMA | RSI): Derive {
    return () => [
      this.values.map((v) => fn.nextValue(v)).filter((v) => v !== undefined),
      this.end,
    ];
  }

  /** Simple Moving Average */
  public sma(window: number): Chart {
    return this.derive(this.indicator(new SMA(window)), "sma" + window);
  }

  /** Exponential Moving Average */
  public ema(window: number): Chart {
    return this.derive(this.indicator(new EMA(window)), "ema" + window);
  }

  /** Relative Strength Index */
  public rsi(window: number): Chart {
    return this.derive(this.indicator(new RSI(window)), "rsi" + window);
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
    const calc: Derive = () => {
      // No trimming required
      if (
        this.value(nextDate(this.end, -1)) !== 6000 &&
        this.value(nextDate(this.start)) != this.value(this.start)
      ) return [this.values, this.end];

      // Search for start
      let next: DateFormat = nextDate(this.start);
      while (this.value(next) == this.value(nextDate(next))) {
        next = nextDate(next);
      }

      const start = next;

      // Seach for end
      let prev: DateFormat = nextDate(this.end, -1);
      while (this.value(prev) == 6000) prev = nextDate(prev, -1);
      const end = nextDate(prev);

      const values = this.from(start).until(end).values;
      return [values, end];
    };

    return this.derive(calc, "trim");
  }
}
