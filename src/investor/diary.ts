import type { Tick } from "📚/tick/mod.ts";

/** Collection of same objects from various ticks */
export class Diary<T> {
  /** Sorted list of ticks where data is available */
  public readonly ticks: Tick[];

  constructor(private readonly cards: Record<Tick, T>) {
    this.ticks = Object.keys(cards).map(Number).sort((a, b) => a - b);
  }

  /** Throw Error if no ticks are available */
  private validate(): void {
    if (this.ticks.length < 1) {
      throw new Error("Data is not available at any tick");
    }
  }

  /** First tick */
  public get start(): Tick {
    this.validate();
    return this.ticks[0];
  }

  /** Last tick */
  public get end(): Tick {
    this.validate();
    return this.ticks[this.ticks.length - 1];
  }

  /** Data at first tick */
  public get first(): T {
    this.validate();
    return this.cards[this.start];
  }

  /** Data at first tick */
  public get last(): T {
    this.validate();
    return this.cards[this.end];
  }

  /** Data on specific tick */
  public on(tick: Tick): T {
    this.validate();
    if (tick in this.cards) return this.cards[tick];
    throw new Error(`Asset on tick ${tick} doesn't exist`);
  }

  /** Find most recent data at or before tick */
  public before(tick: Tick): T {
    this.validate();
    if (tick < this.start) {
      throw new Error(
        `Searching for asset before ${tick} but first tick is ${this.start}`,
      );
    }
    for (const d of [...this.ticks].reverse()) {
      if (d <= tick) return this.cards[d];
    }

    console.log({ tick, ticks: this.ticks, start: this.start, end: this.end });
    throw new Error("This code should never be reached");
  }

  /** Find oldest data at or after tick */
  public after(tick: Tick): T {
    this.validate();
    if (tick > this.end) {
      throw new Error(
        `Searching for asset after ${tick} but last tick is ${this.end}`,
      );
    }
    for (const d of this.ticks) {
      if (d >= tick) return this.cards[d];
    }

    console.log({ tick, ticks: this.ticks, start: this.start, end: this.end });
    throw new Error("This code should never be reached");
  }

  public get export(): Record<Tick, T> {
    return this.cards;
  }
}
