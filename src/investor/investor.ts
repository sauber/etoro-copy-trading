import { Bar, Instrument } from "@sauber/backtest";
import { Diary } from "📚/investor/diary.ts";
import type { Mirror, StatsExport } from "📚/repository/mod.ts";

type Series = Array<number>;

export class Investor extends Instrument {
  constructor(
    public readonly UserName: string,
    public readonly CustomerID: number,
    public readonly FullName: string | undefined,
    chart: Instrument,
    public readonly mirrors: Diary<Mirror[]>,
    public readonly stats: Diary<StatsExport>,
  ) {
    super(chart.values, chart.end, UserName, FullName);
  }

  /** Confirm if investor has chart data at this bar */
  public isActive(bar: Bar): boolean {
    return this.has(bar);
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
