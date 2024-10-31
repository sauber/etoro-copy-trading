import { Asset, Backend } from "📚/storage/mod.ts";

import { Discover } from "./discover.ts";
import type { DiscoverData } from "./discover.ts";

import { Chart } from "./chart.ts";
import type { ChartData } from "./chart.ts";

import { Portfolio } from "./portfolio.ts";
import type { PortfolioData } from "./portfolio.ts";

import { Stats } from "./stats.ts";
import type { StatsData } from "./stats.ts";

import { FetchBackend } from "./types.ts";
import type { DiscoverFilter, InvestorId } from "./types.ts";

type Range = {
  min: number;
  max: number;
};

type Expire = {
  mirror: number;
  discover: number;
  chart: number;
  portfolio: number;
  stats: number;
};

type UserName = string;
type BlacklistProperties = Record<string, unknown>;
type Blacklist = Record<UserName, BlacklistProperties>;

// Convert hours to ms
const msPerHour = 60 * 60 * 1000;

/** Load all data for all investors */
export class Refresh {
  /** Min and max acceptable count of investors */
  private readonly discover_count = {
    min: 70,
    max: 200,
  } as Range;

  /** For how long time are old version valid */
  private readonly expire: Expire = {
    mirror: 16 * msPerHour,
    discover: 50 * msPerHour,
    chart: 24 * msPerHour,
    portfolio: 666 * msPerHour,
    stats: 333 * msPerHour,
  } as Expire;

  // How many external fetches are performed
  private fetchCount = 0;

  constructor(
    private readonly repo: Backend,
    private readonly fetcher: FetchBackend,
    private readonly investor: InvestorId,
    private readonly filter: DiscoverFilter, // TODO: Expire // TODO: Discover Range
    private readonly blacklist: Blacklist
  ) {}

  /** Load  asset from web if missing or expired */
  private async recent<DataFormat>(
    assetname: string,
    expire: number,
    download: () => Promise<DataFormat>,
    validate?: (data: DataFormat) => boolean,
  ): Promise<boolean> {
    const asset = new Asset(assetname, this.repo);

    // Skip if exists and still valid in repo
    if (await asset.exists()) {
      const age: number = await asset.age();
      if (age < expire) return true;
    }

    // Load from web
    const data: DataFormat = await download();
    ++this.fetchCount;

    // Validate content
    if (validate && !validate(data)) {
      console.error(`Error: Asset ${assetname} failed validation`);
      return false;
    }

    // Store downloaded data
    // console.log(`Store asset ${assetname}`);
    if (assetname.match(/.chart$/)) {
      const obj = new Chart(data as ChartData);
      const date = obj.end;
      await asset.store(data, date);
    } else await asset.store(data);
    return true;
  }

  /** Load list of investor ID's from discovery */
  private async discover(): Promise<InvestorId[]> {
    const range: Range = this.discover_count;
    const validate = function (loaded: DiscoverData) {
      const discover: Discover = new Discover(loaded);
      const count: number = discover.count;
      if (count < range.min || count > range.max) {
        throw new Error(
          `Count of discovered investors is ${count}, should be ${range.min}-${range.max}`,
        );
      }
      console.log(`Count of discovered investors is ${count}`);
      return true;
    };

    const expire: Expire = this.expire;
    const available: boolean = await this.recent<DiscoverData>(
      "discover",
      expire.discover,
      () => this.fetcher.discover(this.filter),
      validate,
    );
    if (available) {
      const asset = new Asset<DiscoverData>("discover", this.repo);
      const data: DiscoverData = await asset.last();
      const discover: Discover = new Discover(data);
      return discover.investors;
    } else {
      return [];
    }
  }

  /** Load chart for an investor */
  private chart(investor: InvestorId): Promise<boolean> {
    const validate = function (loaded: ChartData) {
      const chart: Chart = new Chart(loaded);
      if (!chart.validate()) {
        return false;
      }
      return true;
    };

    return this.recent<ChartData>(
      investor.UserName + ".chart",
      this.expire.chart,
      () => this.fetcher.chart(investor),
      validate,
    );
  }

  /** Load portfolio for an investor */
  private portfolio(investor: InvestorId, expire: number): Promise<boolean> {
    return this.recent<PortfolioData>(
      investor.UserName + ".portfolio",
      expire,
      () => this.fetcher.portfolio(investor),
      (loaded: PortfolioData) => new Portfolio(loaded).validate(),
    );
  }

  /** Load stats for an investor */
  private stats(investor: InvestorId): Promise<boolean> {
    return this.recent<StatsData>(
      investor.UserName + ".stats",
      this.expire.stats,
      () => this.fetcher.stats(investor),
      (loaded: StatsData) => new Stats(loaded).validate(),
    );
  }

  /** Load all data for an investor */
  private async loadInvestor(
    investor: InvestorId,
    expire: number = this.expire.portfolio,
  ): Promise<void> {
    if (await this.chart(investor)) {
      await this.stats(investor);
      await this.portfolio(investor, expire);
    }
  }

  /** Extract list of mirrors for root investor */
  private async mirrors(): Promise<InvestorId[]> {
    // First download updated data for investor and save to repo
    await this.loadInvestor(this.investor, this.expire.mirror);

    // Load data from repo
    const asset = new Asset<PortfolioData>(
      this.investor.UserName + ".portfolio",
      this.repo,
    );
    if (await asset.exists()) {
      const data: PortfolioData = await asset.last();
      const portfolio: Portfolio = new Portfolio(data);
      return portfolio.investors;
    } else return [];
  }

  public async run(max?: number): Promise<number> {
    function onlyUnique(value: InvestorId, index: number, self: InvestorId[]) {
      return (
        index ===
          self.findIndex((elem: InvestorId) => elem.UserName === value.UserName)
      );
    }

    // List of uniq investors from discover and mirrors
    const investors: InvestorId[] = [
      ...(await this.mirrors()),
      ...(await this.discover()),
    ];
    const whitelist = investors.filter(id=>!(id.UserName in this.blacklist));
    const subset: InvestorId[] = max ? whitelist.slice(0, max) : whitelist;
    const uniq: InvestorId[] = subset.filter(onlyUnique);

    // In parallel fetch data for all investors
    await Promise.all(
      uniq.map((investor: InvestorId) => this.loadInvestor(investor)),
    );

    // Count of updates
    return this.fetchCount;
  }
}
