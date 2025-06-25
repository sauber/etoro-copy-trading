import { type DateFormat, diffDate, nextDate } from "@sauber/dates";

// Series of numbers
type Numbers = number[];

// Function to calculate derived series and end date
type Derive = () => [series: Numbers, end: DateFormat];

/** Hold series of values and trim off similar start and end values */
export class Trimmer {
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

  /** Create a derived chart, cache for future use */
  private readonly subcharts: Record<string, Trimmer> = {};
  private derive(derive: Derive, id: string): Trimmer {
    if (!(id in this.subcharts)) this.subcharts[id] = new Trimmer(...derive());
    return this.subcharts[id];
  }

  /** Sub chart with entries starting on date */
  public from(start: DateFormat): Trimmer {
    const calc: Derive =
      () => [this.values.slice(diffDate(this.start, start)), this.end];
    return this.derive(calc, "from" + start);
  }

  /** Sub chart with entries until and including date */
  public until(end: DateFormat): Trimmer {
    const calc: Derive =
      () => [this.values.slice(0, diffDate(this.start, end) + 1), end];
    return this.derive(calc, "until" + end);
  }

  /** Trim leading 10000 (means not started) and trailing 6000 (means copy stopped) */
  public get trim(): Trimmer {
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
