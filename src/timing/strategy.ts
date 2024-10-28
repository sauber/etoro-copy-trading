import type { Chart } from "📚/chart/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";

/** Base Strategy class */
export abstract class Strategy {
  public readonly start: DateFormat;
  public readonly end: DateFormat;

  constructor(private readonly chart: Chart) {
    this.start = chart.start;
    this.end = chart.end;
  }

  /** Signal 0-1=buying, -1-0=selling */
  abstract signal(date: DateFormat): number;
}

/** Do nothing */
export class Noop extends Strategy {
  public signal(_date: DateFormat): number {
    return 0;
  }
}

/** Random buying and selling */
export class Random extends Strategy {
  public signal(_date: DateFormat): number {
    return 2 * Math.random() - 1;
  }
}
