import { type DateFormat, diffDate, today } from "@sauber/dates";
import { Backend, JournaledAsset } from "@sauber/journal";
import type {
  ChartResults,
  PortfolioResults,
  StatsResults,
} from "@sauber/etoro-investors";
import { Bar, Instrument } from "@sauber/backtest";

import { Diary, Investor } from "📚/investor/mod.ts";

import { Trimmer } from "./trimmer.ts";
import { Chart } from "./chart.ts";
import { type Mirror, Portfolio } from "./portfolio.ts";
import { Stats, type StatsExport } from "./stats.ts";
import { detrendExponential } from "./detrend.ts";

type MirrorsByDate = Record<DateFormat, Mirror[]>;
type StatsByDate = Record<DateFormat, StatsExport>;
type Dates = Array<DateFormat>;

type OverlappingCharts = {
  start: DateFormat;
  end: DateFormat;
  values: number[];
};

// Format of data in cache
export type InvestorExport = {
  username: string;
  fullname?: string;
  customerid: number;
  chartend: DateFormat;
  chart: number[];
  flat: number[];
  mirrors: MirrorsByDate;
  stats: StatsByDate;
};

/** Given a list of dates, identify the ones within start end end,
 * and the first just before and just after.
 */
function cover(dates: Dates, start: DateFormat, end: DateFormat): Dates {
  const filtered: Dates = dates.filter((date: DateFormat) =>
    date >= start && date <= end
  );

  // If first is not exactly on start, then look for first date before
  if (filtered[0] != start) {
    const before: Dates = dates.filter((date: DateFormat) => date < start);
    filtered.unshift(...before.slice(-1));
  }

  // If last is not exactly at end, then look for first date after
  if (filtered[filtered.length - 1] != end) {
    const after: Dates = dates.filter((date: DateFormat) => date > end);
    filtered.push(...after.slice(0, 1));
  }

  return filtered;
}

/** Extract scraped data and compile an investor object */
export class InvestorAssembly {
  private readonly chartAsset: JournaledAsset<ChartResults>;
  private readonly portfolioAsset: JournaledAsset<PortfolioResults>;
  private readonly statsAsset: JournaledAsset<StatsResults>;
  private readonly compiledAsset: JournaledAsset<InvestorExport>;

  constructor(public readonly UserName: string, readonly repo: Backend) {
    this.chartAsset = new JournaledAsset<ChartResults>(
      this.UserName + ".chart",
      repo,
    );
    this.portfolioAsset = new JournaledAsset<PortfolioResults>(
      this.UserName + ".portfolio",
      repo,
    );
    this.statsAsset = new JournaledAsset<StatsResults>(
      this.UserName + ".stats",
      repo,
    );
    this.compiledAsset = new JournaledAsset<InvestorExport>(
      this.UserName + ".compiled",
      repo,
    );
  }

  /** Customer ID */
  private async CustomerId(): Promise<number> {
    const stats: StatsResults = await this.statsAsset.last();
    const id: number = stats.Data.CustomerId;
    return id;
  }

  /** Customer ID */
  private async FullName(): Promise<string | undefined> {
    const stats: StatsResults = await this.statsAsset.last();
    return stats.Data.FullName;
  }

  /** Last date where any asset is present */
  private _end: DateFormat | undefined;
  private async end(): Promise<DateFormat> {
    if (this._end) return this._end;

    const dates = await Promise.all([
      this.chartAsset.end(),
      this.statsAsset.end(),
      this.statsAsset.end(),
    ]);
    // The most last
    const [last] = dates.sort().slice(-1);
    this._end = last;
    return last;
  }

  /** Combination of as few charts as possible from start to end */
  public async chart(): Promise<OverlappingCharts> {
    // All dates having a chart
    const dates: DateFormat[] = await this.chartAsset.dates();

    // Load latest chart
    let end: DateFormat = dates[dates.length - 1];
    const lastData: ChartResults = await this.chartAsset.retrieve(end);
    const lastChart = new Chart(lastData);
    const compiled = new Trimmer(lastChart.values, end).trim;
    const values: number[] = compiled.values;
    let start: DateFormat = compiled.start;
    end = compiled.end;

    // Prepend older charts
    // Search backwards to find oldest chart which still overlaps
    for (let i = dates.length - 2; i >= 0; i--) {
      const date = dates[i];
      if (date < start) break; // Too old to overlap
      if (i > 0 && dates[i - 1] >= start) continue; // An even older exists and overlaps

      // Load older chart
      const loaded: Chart = new Chart(await this.chartAsset.retrieve(date));
      const sooner: Trimmer = new Trimmer(loaded.values, loaded.end).trim;

      // Confirm even after trimming, there is still overlap
      if (sooner.end < start) {
        console.warn(
          `${this.UserName} sooner chart after trimming no longer overlaps. Keeping newest chart only.`,
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
      values.splice(0, 0, ...prepend);

      // New start
      start = sooner.start;
    }

    // Truncate floating digits to 2
    const price = values.map((v) => +v.toFixed(2));
    // Caching
    return {
      start: start,
      end: end,
      values: price,
    };
  }

  /** Extract essential data from stats on date */
  private async statsValues(date: DateFormat): Promise<StatsExport> {
    const loaded: StatsResults = await this.statsAsset.retrieve(date);
    const stats = new Stats(loaded);
    return stats.value;
  }

  /** Extract stats for all available dates within chart range and maximum 1 before and 1 after */
  private async stats(chart: OverlappingCharts): Promise<StatsByDate> {
    // Dates
    const available: Dates = await this.statsAsset.dates();
    const range: Dates = cover(available, chart.start, chart.end);

    // Load Stats axports for eachd date in range
    const values: StatsExport[] = await Promise.all(
      range.map((date: DateFormat) => this.statsValues(date)),
    );

    // Zip Dates and Stats
    const zip: StatsByDate = Object.assign(
      {},
      ...range.map((date, index) => ({ [date]: values[index] })),
    );
    return zip;
  }

  /** Extract list of investors from portfolio */
  private async portfolioValues(date: DateFormat): Promise<Mirror[]> {
    const loaded: PortfolioResults = await this.portfolioAsset.retrieve(date);
    const portfolio = new Portfolio(loaded);
    return portfolio.mirrors;
  }

  /** Latest mirrors */
  private async mirrors(chart: OverlappingCharts): Promise<MirrorsByDate> {
    // Dates
    const available: Dates = await this.portfolioAsset.dates();
    const range: Dates = cover(available, chart.start, chart.end);

    // Load Stats exports for each date in range
    const values: Mirror[][] = await Promise.all(
      range.map((date) => this.portfolioValues(date)),
    );

    // Zip Dates and Stats
    // Skip consecutive equals
    const zip: MirrorsByDate = {};
    // let prev: Names;
    range.forEach((date: DateFormat, index: number) => {
      const cur: Mirror[] = values[index];
      // const curnames: Names = cur.map((id: Mirror) => id.UserName);
      // Skip if same as before
      // TODO: Code below is broken. All data is missing after empty mirrors list.
      // if (index > 0 && prev.reduce((a, b) => a && curnames.includes(b), true)) {
      // false;
      // } // Keep
      // else {
      zip[date] = cur;
      // prev = cur.map((id: InvestorId) => id.UserName);
      // }
    });

    return zip;
  }

  /** Confirm if raw data is sufficiently complete to compile an investor */
  private async validate(): Promise<boolean> {
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

  /** Load previously compiled investor, or generate */
  private async compile(): Promise<InvestorExport> {
    // console.log("Compile data for", this.UserName);
    const chart: OverlappingCharts = await this.chart();
    const chartend: DateFormat = chart.end;
    const stats: StatsByDate = await this.stats(chart);
    const mirrors: MirrorsByDate = await this.mirrors(chart);
    const fullname: string | undefined = await this.FullName();
    const customerid: number = await this.CustomerId();
    return {
      username: this.UserName,
      fullname,
      customerid,
      chartend,
      chart: chart.values,
      flat: Array.from(detrendExponential(new Float32Array(chart.values))).map((
        v,
      ) => +v.toFixed(2)),
      mirrors,
      stats,
    };
  }

  /** Confirm if compiled data is valid */
  private compiled(data: InvestorExport): true | string {
    const username: string = data.username;
    // Confirm all required properties are present
    for (
      const prop of [
        "username",
        "customerid",
        "chartend",
        "chart",
        "flat",
        "mirrors",
        "stats",
      ]
    ) {
      if (!(prop in data)) {
        return `Investor ${username} is missing property ${prop}`;
      }
    }
    // Confirm mirrors have Value parameter
    for (const [_date, mirrors] of Object.entries(data.mirrors)) {
      for (const mirror of mirrors) {
        if (
          !mirror.Value
        ) return `Investor ${username} mirror is missing Value property`;
      }
    }

    // Confirm no negative values in charts
    for (const value of data.chart) {
      if (value < 0) return `Investor ${username} chart has negative value`;
    }
    for (const value of data.flat) {
      if (value < 0) return `Investor ${username} flat has negative value`;
    }
    return true;
  }

  /** Attempt to load from cache */
  private async cached(): Promise<InvestorExport | undefined> {
    // Cached version doesn't exist
    if (!await this.compiledAsset.exists()) return undefined;

    // Is cached version too old?
    const prev: DateFormat = await this.compiledAsset.end();
    const end: DateFormat = await this.end();
    if (end > prev) {
      await this.compiledAsset.erase();
      return undefined;
    }

    // Confirm asset validates, otherwise erase
    const loaded = await this.compiledAsset.last();
    if (this.compiled(loaded) === true) return loaded;
    await this.compiledAsset.erase();
  }

  /** Load or generate investor */
  private async refresh(): Promise<InvestorExport> {
    // Does cache exist and is valid?
    const cached: InvestorExport | undefined = await this.cached();
    if (cached) return cached;

    // Compile investor from asset
    const compiled: InvestorExport = await this.compile();

    // Validate compiled data
    const error: true | string = this.compiled(compiled);
    if (typeof error === "string") {
      console.error(error);
      throw new Error(
        `Investor ${this.UserName} data is invalid. Cannot compile.`,
      );
    }

    // Store compiled data
    const date = await this.end();
    await this.compiledAsset.store(compiled, date);
    console.warn("Investor data cached for", this.UserName, "end", date);
    return compiled;
  }

  /** Generate investor object from raw data */
  private generate(data: InvestorExport, series: number[]): Investor {
    const end: Bar = diffDate(data.chartend, today());
    const chart = new Instrument(new Float32Array(series), end);
    return new Investor(
      this.UserName,
      data.customerid,
      data.fullname,
      chart,
      new Diary(data.mirrors),
      new Diary(data.stats),
    );
  }

  /** Create investor object from cached data */
  public async investor(): Promise<Investor> {
    const loaded: InvestorExport = await this.refresh();
    return this.generate(loaded, loaded.chart);
  }

  /** Create investor object from cached data, with untrended chart */
  public async testInvestor(): Promise<Investor> {
    const loaded: InvestorExport = await this.refresh();
    return this.generate(loaded, loaded.flat);
  }
}
