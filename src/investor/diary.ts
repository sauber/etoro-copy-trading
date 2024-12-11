import type { DateFormat } from "../time/mod.ts";

/** Collection of same objects from various dates */
export class Diary<T> {
  /** Sorted list of dates where data is available */
  public readonly dates: DateFormat[];

  constructor(private readonly cards: Record<DateFormat, T>) {
    this.dates = Object.keys(cards).sort();
  }

  /** Throw Error if no dates are available */
  private validate(): void {
    if (this.dates.length < 1) {
      throw new Error("Data is not available at any date");
    }
  }

  /** First date */
  public get start(): DateFormat {
    this.validate();
    return this.dates[0];
  }

  /** Last date */
  public get end(): DateFormat {
    this.validate();
    return this.dates[this.dates.length - 1];
  }

  /** Data at first date */
  public get first(): T {
    this.validate();
    return this.cards[this.start];
  }

  /** Data at first date */
  public get last(): T {
    this.validate();
    return this.cards[this.end];
  }

  /** Data on date */
  public on(date: DateFormat): T {
    this.validate();
    if (date in this.cards) return this.cards[date];
    throw new Error(`Asset on ${date} doesn't exist`);
  }

  /** Find most recent data at or before date */
  public before(date: DateFormat): T {
    this.validate();
    if (date < this.start) {
      throw new Error(
        `Searching for asset before ${date} but first date is ${this.start}`,
      );
    }
    for (const d of [...this.dates].reverse()) {
      if (d <= date) return this.cards[d];
    }

    console.log({ date, dates: this.dates, start: this.start, end: this.end });
    throw new Error("This code should never be reached");
  }

  /** Find oldest data at or after date */
  public after(date: DateFormat): T {
    this.validate();
    if (date > this.end) {
      throw new Error(
        `Searching for asset after ${date} but last date is ${this.end}`,
      );
    }
    for (const d of this.dates) {
      if (d >= date) return this.cards[d];
    }

    console.log({ date, dates: this.dates, start: this.start, end: this.end });
    throw new Error("This code should never be reached");
  }

  public get export(): Record<DateFormat, T> {
    return this.cards;
  }
}
