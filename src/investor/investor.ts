import { Chart } from "📚/chart/mod.ts";
import { Diary } from "📚/investor/diary.ts";
import type { Mirror, StatsExport } from "📚/repository/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";

export class Investor {
  constructor(
    public readonly UserName: string,
    public readonly CustomerID: number,
    public readonly FullName: string | undefined,
    public readonly chart: Chart,
    public readonly mirrors: Diary<Mirror[]>,
    public readonly stats: Diary<StatsExport>,
  ) {}

  /** Confirm if investor has chart data on this date */
  public active(date: DateFormat): boolean {
    if (this.chart.start <= date && this.chart.end >= date) return true;
    else return false;
  }

  /** Is Fund? */
  public get isFund(): boolean {
    return this.stats.last.IsFund;
  }

  /** Is Popular Investor? */
  public get isPopularInvestor(): boolean {
    return this.stats.last.PopularInvestor;
  }
}
