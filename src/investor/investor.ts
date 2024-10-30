import { Chart } from "📚/chart/mod.ts";
import { Diary } from "📚/investor/diary.ts";
import type { StatsExport, InvestorId } from "📚/repository/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";

export type InvestorExport = {
  UserName: string;
  CustomerID: number;
  FullName: string | undefined;
  end: DateFormat;
  chart: number[];
  mirrors: Record<DateFormat, InvestorId[]>;
  stats: Record<DateFormat, StatsExport>;
};

export class Investor {
  constructor(
    public readonly UserName: string,
    public readonly CustomerID: number,
    public readonly FullName: string | undefined,
    public readonly chart: Chart,
    public readonly mirrors: Diary<InvestorId[]>,
    public readonly stats: Diary<StatsExport>
  ) {}

  /** Confirm if investor has valid data on this date */
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

  // Export raw data
  // public get export(): InvestorExport {
  //   return {
  //     UserName: this.UserName,
  //     CustomerID: this.CustomerID,
  //     FullName: this.FullName,
  //     end: this.chart.end,
  //     chart: this.chart.values,
  //     mirrors: this.mirrors.export,
  //     stats: this.stats.export,
  //   };
  // }

  // Generate new object from raw data
  // static import(data: InvestorExport): Investor {
  //   return new Investor(
  //     data.UserName,
  //     data.CustomerID,
  //     data.FullName,
  //     new Chart(data.chart, data.end),
  //     new Diary<InvestorId[]>(data.mirrors),
  //     new Diary<StatsExport>(data.stats),
  //   )
  // }
}
