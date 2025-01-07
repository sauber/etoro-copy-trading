import { Bar, Chart } from "@sauber/backtest";
import { Diary } from "📚/investor/diary.ts";
import type { Mirror, StatsExport } from "📚/repository/mod.ts";

export class Investor {
  constructor(
    public readonly UserName: string,
    public readonly CustomerID: number,
    public readonly FullName: string | undefined,
    public readonly chart: Chart,
    public readonly mirrors: Diary<Mirror[]>,
    public readonly stats: Diary<StatsExport>,
  ) {}

  /** Confirm if investor has chart data at this bar */
  public isActive(bar: Bar): boolean {
    return this.chart.has(bar);
  }

  /** Is Fund? */
  public get isFund(): boolean {
    if ( this.stats.dates.length < 1 ) return false;
    return this.stats.last.IsFund;
  }

  /** Is Popular Investor? */
  public get isPopularInvestor(): boolean {
    if ( this.stats.dates.length < 1 ) return false;
    return this.stats.last.PopularInvestor;
  }
}
