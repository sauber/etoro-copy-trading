import { DateFormat } from "/utils/time/mod.ts";
import { ChartSeries, Community, Investor } from "/investor/mod.ts";
import type { Names, StatsData } from "/investor/mod.ts";
import { Asset } from "/repository/mod.ts";
import { ProgressBar } from "/utils/time/progressbar.ts";
import { DataFrame } from "/utils/dataframe.ts";

type FeatureData = Record<string, number>;

/** Load all relevant data for investor */
class FeatureLoader {
  /** List of all stats files */
  private readonly allStats: Asset<StatsData>;

  constructor(private readonly investor: Investor) {
    this.allStats = investor.statsSeries;
  }

  /** Full chart */
  private _chart: ChartSeries | null = null;
  private async fullChart(): Promise<ChartSeries> {
    if (!this._chart) this._chart = await this.investor.chart();
    return this._chart;
  }

  /** Date of first available stats within chart range */
  private async start(): Promise<DateFormat> {
    const chart = await this.fullChart();
    const chartStart: DateFormat = chart.start();
    const statsStart: DateFormat = await this.allStats.after(chartStart);
    return statsStart;
  }

  /** First set of stats data within chart range */
  private _stats: StatsData | null = null;
  public async stats(): Promise<StatsData> {
    if (!this._stats) {
      const date = await this.start();
      this._stats = await this.allStats.value(date);
    }
    return this._stats;
  }

  /** Chart start from date of stats */
  public async chart(): Promise<ChartSeries> {
    const date: DateFormat = await this.start();
    const full: ChartSeries = await this.fullChart();
    const slice: ChartSeries = full.from(date);
    return slice;
  }
}

/** Extract features impacting ranking for an investor */
class Features {
  constructor(
    private readonly chart: ChartSeries,
    private readonly stats: StatsData,
  ) {}

  /** Number of days between start and end */
  public get days(): number {
    return this.chart.values.length;
  }

  /** Average yearly Profit */
  public get profit(): number {
    const profit: number = this.chart.last() / this.chart.first() - 1;
    const apy: number = (365 / this.days) * profit;
    return apy;
  }

  public get input(): FeatureData {
    const d = this.stats.Data;
    return {
      PopularInvestor: d.PopularInvestor ? 1 : 0,
      Gain: d.Gain,
      RiskScore: d.RiskScore,
      MaxDailyRiskScore: d.MaxDailyRiskScore,
      MaxMonthlyRiskScore: d.MaxMonthlyRiskScore,
      Copiers: d.Copiers,
      CopiersGain: d.CopiersGain,
      VirtualCopiers: d.VirtualCopiers,
      AUMTier: d.AUMTier,
      AUMTierV2: d.AUMTierV2,
      Trades: d.Trades,
      WinRatio: d.WinRatio,
      DailyDD: d.DailyDD,
      WeeklyDD: d.WeeklyDD,
      ProfitableWeeksPct: d.ProfitableWeeksPct,
      ProfitableMonthsPct: d.ProfitableMonthsPct,
      Velocity: d.Velocity,
      Exposure: d.Exposure,
      AvgPosSize: d.AvgPosSize,
      HighLeveragePct: d.HighLeveragePct,
      MediumLeveragePct: d.MediumLeveragePct,
      LowLeveragePct: d.LowLeveragePct,
      PeakToValley: d.PeakToValley,
      LongPosPct: d.LongPosPct,
      ActiveWeeks: d.ActiveWeeks,
      ActiveWeeksPct: d.ActiveWeeksPct,
      WeeksSinceRegistration: d.WeeksSinceRegistration,
    };
  }

  public get output(): FeatureData {
    return {
      Profit: this.profit,
      // 0.05 is safe returns ie. money market 5% yearly returns
      // TODO move to config
      SharpeRatio: this.chart.sharpeRatio(0.05),
    };
  }
}

export class Ranking {
  /** Minimum number of days in chart after stats */
  public days = 60;

  constructor(private readonly community: Community) {}

  /** List of all names */
  private names(): Promise<Names> {
    return this.community.names();
  }

  /** Generate investor object */
  private investor(username: string): Investor {
    return this.community.investor(username);
  }

  /** Features object for named investor */
  private async features(username: string): Promise<Features> {
    const loader = new FeatureLoader(this.investor(username));
    const chart: ChartSeries = await loader.chart();
    const stats: StatsData = await loader.stats();
    return new Features(chart, stats);
  }

  /** Confirm is features are usable */
  private validate(features: Features): boolean {
    if (features.days < this.days) return false;
    const out: FeatureData = features.output;
    const o = Object.values(out);
    if (o.some((e) => Number.isNaN(e) || e === Infinity || e === -Infinity)) {
      return false;
    }
    return true;
  }

  public async data(): Promise<DataFrame> {
    const list: FeatureData[] = [];
    const names = await this.names();
    const bar = new ProgressBar("Loading", names.size);
    let count = 0;
    let keep = 0;
    for (const username of names) {
      ++count;
      bar.total = names.size - count + keep;
      await bar.update(keep);
      //console.log(username);
      if (!(await this.investor(username).isValid())) continue;
      const features = await this.features(username);
      if ( ! this.validate(features)) continue;
      //console.log('☑');
      list.push({ ...features.input, ...features.output });
      ++keep;
      //if ( ++ count >= 5 ) break;
    }
    bar.finish();

    return DataFrame.fromRecords(list);
  }
}
