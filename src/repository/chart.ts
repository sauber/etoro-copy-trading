import { type DateFormat, nextDate, today } from "@sauber/dates";
import type { ChartItem, ChartResults } from "@sauber/etoro-investors";

/** Convert scraped timestamps to DateFormat */
function date(timestamp: string): DateFormat {
  return timestamp.substring(0, 10);
}

/** Scraped chart data from eToro */
export class Chart {
  // Max delay in number of days in chart
  public readonly maxAge: number = 2;

  constructor(private readonly raw: ChartResults, data?: Partial<Chart>) {
    Object.assign(this, data);
  }

  private get list(): ChartItem[] {
    return this.raw.simulation.oneYearAgo?.chart || [];
  }

  /** First date in chart */
  public get start(): DateFormat {
    const list: ChartItem[] = this.list;
    return date(list[0].timestamp);
  }

  /** Last date in chart */
  public get end(): DateFormat {
    const list: ChartItem[] = this.list;
    return date(list[list.length - 1].timestamp);
  }

  public get count(): number {
    return this.list.length;
  }

  public validate(): boolean {
    const todayDate: DateFormat = today();
    const expectedDate: DateFormat = nextDate(todayDate, -this.maxAge);
    if (this.end > todayDate) {
      console.error(`Error: Last date ${this.end} is in the future`);
      return false;
    }
    if (this.end < expectedDate) {
      console.error(
        `Error: End date ${this.end} is older than ${expectedDate}`,
      );
      return false;
    }
    return true;
  }

  /** Equity series */
  public get values(): number[] {
    const list: ChartItem[] = this.list;
    return list.map((entry: ChartItem) => entry.equity);
  }
}
