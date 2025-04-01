import type { DateFormat } from "📚/time/mod.ts";
import { nextDate, today } from "📚/time/mod.ts";

type ChartEntry = {
  timestamp: string;
  equity: number;
};

export type ChartData = {
  simulation: {
    oneYearAgo: {
      chart: ChartEntry[];
    };
  };
};

/** Convert scraped timestamps to DateFormat */
function date(timestamp: string): DateFormat {
  return timestamp.substring(0, 10);
}

/** Scraped chart data from eToro */
export class Chart {
  // Max delay in number of days in chart
  public readonly maxAge: number = 2;

  constructor(private readonly raw: ChartData, data?: Partial<Chart>) {
    Object.assign(this, data);
  }

  private get list(): ChartEntry[] {
    return this.raw.simulation.oneYearAgo?.chart || [];
  }

  /** First date in chart */
  public get start(): DateFormat {
    const list: ChartEntry[] = this.list;
    return date(list[0].timestamp);
  }

  /** Last date in chart */
  public get end(): DateFormat {
    const list: ChartEntry[] = this.list;
    return date(list[list.length - 1].timestamp);
  }

  public get count(): number {
    return this.list.length;
  }

  public validate(): boolean {
    // const maxAge = 3;
    const todayDate: DateFormat = today();
    const expectedDate: DateFormat = nextDate(todayDate, -this.maxAge);
    // const active = (12 - 1) * 7 - 1; // 12-1 weeks
    // if (this.count < active) {
    //   console.error(`Error: Too few dates in chart: ${this.count}`);
    //   return false;
    // }
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
    const list: ChartEntry[] = this.list;
    return list.map((entry: ChartEntry) => entry.equity);
  }
}
