import { RateLimit } from "@sauber/ratelimit";
import {
  chart,
  discover as screener,
  DiscoverParameters,
  stats,
  type StatsResponse,
} from "@sauber/etoro-investors";

import type { DiscoverData } from "📚/repository/discover.ts";
import type { ChartData } from "📚/repository/chart.ts";
import type { PortfolioData } from "📚/repository/portfolio.ts";
import type { StatsData } from "📚/repository/stats.ts";
import { DiscoverFilter, FetchBackend } from "📚/repository/types.ts";
import type { InvestorId } from "📚/repository/types.ts";

import { FetchURL } from "./fetch-url.ts";
import { fetchjson } from "./fetch-json.ts";

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

  public async screener(filter: DiscoverParameters): Promise<DiscoverData> {
    console.log("Discover Filter", filter);
    const result = await this.ratelimit.limit(() => screener(filter));
    console.log("discover", filter);
    return result;
  }

  public async chart(investor: InvestorId): Promise<ChartData> {
    // return this.fetch<ChartData>(this.url.chart(investor));
    const result = await this.ratelimit.limit(() => chart(investor.UserName));
    console.log(investor.UserName, "chart");
    return result;
  }

  public portfolio(investor: InvestorId): Promise<PortfolioData> {
    return this.fetch<PortfolioData>(this.url.portfolio(investor));
  }

  public async stats(investor: InvestorId): Promise<StatsData> {
    // return this.fetch<StatsData>(this.url.stats(investor));
    const result: StatsResponse = await this.ratelimit.limit(() =>
      stats(investor.CustomerId)
    );
    console.log(investor.UserName, "stats");
    return result;
  }
}
