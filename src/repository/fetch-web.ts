import { FetchURL } from "./fetch-url.ts";
import { RateLimit } from "./ratelimit.ts";
import { fetchjson } from "./fetch-json.ts";

import type { DiscoverData } from "./discover.ts";
import type { ChartData } from "./chart.ts";
import type { PortfolioData } from "./portfolio.ts";
import type { StatsData } from "./stats.ts";

import { DiscoverFilter, FetchBackend } from "./mod.ts";
import type { InvestorId } from "./mod.ts";

/** Fetch objects from eToro API */
export class FetchWebBackend implements FetchBackend {
  private readonly url = new FetchURL();
  private readonly ratelimit: RateLimit;

  constructor(private readonly rate: number) {
    this.ratelimit = new RateLimit(rate);
  }

  /** Ratelimit calls to fetchjson */
  private fetch<T>(url: string): Promise<T> {
    return this.ratelimit.limit(() => fetchjson(url)) as Promise<T>;
  }

  public discover(filter: DiscoverFilter): Promise<DiscoverData> {
    return this.fetch<DiscoverData>(this.url.discover(filter));
  }

  public chart(investor: InvestorId): Promise<ChartData> {
    return this.fetch<ChartData>(this.url.chart(investor));
  }

  public portfolio(investor: InvestorId): Promise<PortfolioData> {
    return this.fetch<PortfolioData>(this.url.portfolio(investor));
  }

  public stats(investor: InvestorId): Promise<StatsData> {
    return this.fetch<StatsData>(this.url.stats(investor));
  }
}
