import type { DateFormat } from "📚/time/mod.ts";
import { diffDate, nextDate } from "📚/time/calendar.ts";
import { Asset, Backend } from "📚/storage/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Chart as CompiledChart } from "📚/chart/mod.ts";
import { InvestorId } from "📚/repository/mod.ts";

import type { ChartData } from "📚/repository/chart.ts";
import { Chart } from "📚/repository/chart.ts";

import type { PortfolioData } from "📚/repository/portfolio.ts";
import { Portfolio } from "📚/repository/portfolio.ts";

import type { StatsData, StatsExport } from "📚/repository/stats.ts";
import { Stats } from "📚/repository/stats.ts";
import { Diary } from "📚/investor/diary.ts";
import type { InvestorExport } from "📚/investor/investor.ts";

export type MirrorsByDate = Record<DateFormat, InvestorId[]>;
export type StatsByDate = Record<DateFormat, StatsExport>;
type Dates = Array<DateFormat>;

/** Extract scraped data and compile an investor object */
export class InvestorAssembly {
  private readonly chartAsset: Asset<ChartData>;
  private readonly portfolioAsset: Asset<PortfolioData>;
  private readonly statsAsset: Asset<StatsData>;
  private readonly compiledAsset: Asset<InvestorExport>;

  constructor(public readonly UserName: string, readonly repo: Backend) {
    //console.log('InvestorAssembly', {repo});
    this.chartAsset = new Asset<ChartData>(this.UserName + ".chart", repo);
    this.portfolioAsset = new Asset<PortfolioData>(
      this.UserName + ".portfolio",
      repo,
    );
    this.statsAsset = new Asset<StatsData>(this.UserName + ".stats", repo);
    this.compiledAsset = new Asset<InvestorExport>(
      this.UserName + ".compiled",
      repo,
    );
  }

  /** Customer ID */
  public async CustomerId(): Promise<number> {
    const stats: StatsData = await this.statsAsset.last();
    const id: number = stats.Data.CustomerId;
    return id;
  }

  /** Customer ID */
  public async FullName(): Promise<string | undefined> {
    const stats: StatsData = await this.statsAsset.last();
    return stats.Data.FullName;
  }

  /** First date of combined charts */
  public async start(): Promise<DateFormat> {
    const chart: number[] = await this.chart();
    const end: DateFormat = await this.end();
    const days: number = chart.length;
    const start: DateFormat = nextDate(end, -days + 1);
    return start;
  }

  /** Last date where chart is present */
  public end(): Promise<DateFormat> {
    return this.chartAsset.end();
  }

  /** Combination of as few charts as possible from start to end */
  private _chart: number[] | null = null;
  public async chart(): Promise<number[]> {
    // Caching
    if (this._chart) return this._chart;

    // All dates having a chart
    const dates: DateFormat[] = await this.chartAsset.dates();

    // Load latest chart
    const end: DateFormat = dates[dates.length - 1];
    const lastData: ChartData = await this.chartAsset.retrieve(end);
    const lastChart = new Chart(lastData);
    const compiled = new CompiledChart(lastChart.values, end).trim;
    const values: number[] = compiled.values;
    let start: DateFormat = compiled.start;

    // Prepend older charts
    // Search backwards to find oldest chart which still overlaps
    for (let i = dates.length - 2; i >= 0; i--) {
      const date = dates[i];
      if (date < start) break; // Too old to overlap
      if (i > 0 && dates[i - 1] >= start) continue; // An even older exists and overlaps

      // Load older chart
      const loaded: Chart = new Chart(await this.chartAsset.retrieve(date));
      const sooner: CompiledChart =
        new CompiledChart(loaded.values, loaded.end).trim;

      // Confirm even after trimming, there is still overlap
      if (sooner.end < start) {
        console.warn(
          `${this.UserName} sooner chart after trimming no longer overlaps.`,
        );
        break;
      }

      // Does newer chart fully overlap older?
      if (sooner.start >= start) break;

      // How many days from sooner to prepend
      const days: number = diffDate(sooner.start, start);

      // Amount to scale values from sooner
      const scale: number = values[0] / sooner.values[days];

      // Array to be prepended
      const prepend: number[] = sooner.values
        .slice(0, days)
        .map((value) => value * scale);
      //console.log({date, days, scale, prepend});
      values.splice(0, 0, ...prepend);

      // New start
      start = sooner.start;
    }

    // Truncate floating digits to 2
    const price = values.map((v) => +v.toFixed(2));
    // Caching
    this._chart = price;
    return price;
  }

  /** Extract essential data from stats on date */
  private async statsValues(date: DateFormat): Promise<StatsExport> {
    const loaded: StatsData = await this.statsAsset.retrieve(date);
    const stats = new Stats(loaded);
    return stats.value;
  }

  /** Extract stats for all available dates within chart range and maximum 1 before and 1 after */
  public async stats(): Promise<StatsByDate> {
    // Dates
    // const start: DateFormat = await this.start();
    const dates: DateFormat[] = await this.statsAsset.dates();
    const start: DateFormat = await this.chart.start;
    const end: DateFormat = await this.chart.end;
    // const range: DateFormat[] = dates.filter((date) => date >= start);
    const within: Dates = dates.filter((date: DateFormat) =>
      date >= start && date <= end
    );
    const before: Dates = dates.filter((date: DateFormat) => date < start);
    const after: Dates = dates.filter((date: DateFormat) => date > end);

    // The first before range
    const range: Dates = [...before.slice(-1), ...within, ...after.slice(0, 1)];

    // Load Stats axports for eachd date in range
    const values: StatsExport[] = await Promise.all(
      range.map((date) => this.statsValues(date)),
    );

    // Zip Dates and Stats
    const zip: StatsByDate = Object.assign(
      {},
      ...range.map((date, index) => ({ [date]: values[index] })),
    );
    return zip;
  }

  /** Extract list of investors from portfolio */
  private async portfolioValues(date: DateFormat): Promise<InvestorId[]> {
    const loaded: PortfolioData = await this.portfolioAsset.retrieve(date);
    const portfolio = new Portfolio(loaded);
    return portfolio.investors;
  }

  /** Latest mirrors */
  public async mirrors(): Promise<MirrorsByDate> {
    // Dates
    const start: DateFormat = await this.start();
    const end: DateFormat = await this.end();
    const dates: DateFormat[] = await this.portfolioAsset.dates();
    const range: DateFormat[] = dates.filter(
      (date) => date >= start && date <= end,
    );

    // Load Stats exports for each date in range
    const values: InvestorId[][] = await Promise.all(
      range.map((date) => this.portfolioValues(date)),
    );

    // Zip Dates and Stats
    // TODO: Skip dates with empty list of mirrors
    const zip: MirrorsByDate = Object.assign(
      {},
      ...range.map((date, index) => ({ [date]: values[index] })),
    );
    return zip;
  }

  public async validate(): Promise<boolean> {
    // At least on chart file
    const chartDates: DateFormat[] = await this.chartAsset.dates();
    if (chartDates.length < 1) return false;
    const chartStart: DateFormat = await this.chartAsset.start();
    const chartEnd: DateFormat = await this.chartAsset.end();

    // At least one stats file within range of chart
    const statsDates: DateFormat[] = await this.chartAsset.dates();
    const statsInRange = statsDates.filter(
      (date) => date >= chartStart && date <= chartEnd,
    );
    if (statsInRange.length < 1) return false;

    // At least one positions file within range of chart
    const positionsDates: DateFormat[] = await this.chartAsset.dates();
    const positionsInRange = positionsDates.filter(
      (date) => date >= chartStart && date <= chartEnd,
    );
    if (positionsInRange.length < 1) return false;

    return true;
  }

  /** Combined investor object */
  public async investor(): Promise<Investor> {
    return new Investor(
      this.UserName,
      await this.CustomerId(),
      await this.FullName(),
      new CompiledChart(await this.chart(), await this.end()),
      new Diary<InvestorId[]>(await this.mirrors()),
      new Diary<StatsExport>(await this.stats()),
    );
  }

  /** Load previously compiled investor, or generate */
  public async compiled(): Promise<Investor> {
    const end: DateFormat = await this.end();
    if (await this.compiledAsset.exists()) {
      if (end > (await this.compiledAsset.end())) {
        // Newer data exists, expire all previous compiled files
        await this.compiledAsset.erase();
      } else {
        // Old compiled investor is still valid
        //console.log(`Reusing compiled data`);
        const data: InvestorExport = await this.compiledAsset.last();
        const investor: Investor = Investor.import(data);
        return investor;
      }
    }

    // Generate new compiled investor, and save at end date
    const investor: Investor = await this.investor();
    const data = investor.export;
    console.log(`Compile ${end} ${this.UserName}`);
    await this.compiledAsset.store(data, end);
    return investor;
  }
}
