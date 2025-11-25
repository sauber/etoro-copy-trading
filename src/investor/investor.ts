import { Bar, Instrument, Series } from "@sauber/backtest";
import { Diary } from "📚/investor/diary.ts";
import type { Mirror, StatsExport } from "📚/repository/mod.ts";

export class Investor extends Instrument {
  constructor(
    public readonly UserName: string,
    public readonly CustomerID: number,
    public readonly FullName: string | undefined,
    chart: Instrument,
    public readonly mirrors: Diary<Mirror[]>,
    public readonly stats: Diary<StatsExport>,
  ) {
    super(chart.series, chart.end, UserName, FullName);
  }

  /** Confirm if investor has chart data at this bar */
  public isActive(bar: Bar): boolean {
    return this.has(bar);
  }

  /** Is Fund? */
  public get isFund(): boolean {
    if (this.stats.dates.length < 1) return false;
    return this.stats.last.IsFund;
  }

  /** Is Popular Investor? */
  public get isPopularInvestor(): boolean {
    if (this.stats.dates.length < 1) return false;
    return this.stats.last.PopularInvestor;
  }

  /** Copy properties to new object */
  private derived(chart: Instrument): Investor {
    return new Investor(
      this.UserName,
      this.CustomerID,
      this.FullName,
      chart,
      this.mirrors,
      this.stats,
    );
  }

  /** Generate a derived Investor with trimmed chart */
  public trimmed(): Investor {
    const source: Series = this.series;

    // Search from beginning until two adjacent values are no longer equal
    let start = 0;
    while (source[start] == source[start + 1]) start++;

    // Search from end until two adjacent values are no longer 6000
    let end = source.length;
    while (source[end - 2] == 6000) end--;

    // No trimming required
    if (start == 0 && end == source.length) return this;

    // Slice series
    const target = source.slice(start, end);
    const endBar: Bar = this.end + source.length - end;

    return this.derived(new Instrument(target, endBar));
  }
}
