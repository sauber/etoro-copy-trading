import { RateLimit } from "@sauber/ratelimit";
import {
  chart,
  discover as screener,
  DiscoverParameters,
  portfolio,
  stats,
  type StatsResponse,
} from "@sauber/etoro-investors";

import type { DiscoverData } from "📚/repository/discover.ts";
import type { ChartData } from "📚/repository/chart.ts";
import type { PortfolioData } from "📚/repository/portfolio.ts";
import type { StatsData } from "📚/repository/stats.ts";
import { FetchBackend } from "📚/repository/types.ts";
import type { InvestorId } from "📚/repository/types.ts";

import { FetchURL } from "./fetch-url.ts";

/** Fetch objects from eToro API */
export class FetchWebBackend implements FetchBackend {
  private readonly url = new FetchURL();
  private readonly ratelimit: RateLimit;

  constructor(private readonly rate: number) {
    this.ratelimit = new RateLimit(rate);
  }

  public async discover(filter: DiscoverParameters): Promise<DiscoverData> {
    console.log("Start discover", filter);
    const result = await this.ratelimit.limit(() => screener(filter));
    console.log("discover entries", result.TotalRows);
    return result;
  }

  public async chart(investor: InvestorId): Promise<ChartData> {
    const result = await this.ratelimit.limit(() => chart(investor.UserName));
    console.log(investor.UserName, "chart");
    return result;
  }

  public async portfolio(investor: InvestorId): Promise<PortfolioData> {
    const result = await this.ratelimit.limit(() =>
      portfolio(investor.CustomerId)
    );
    console.log(investor.UserName, "portfolio");
    return result;
  }

  public async stats(investor: InvestorId): Promise<StatsData> {
    const result: StatsResponse = await this.ratelimit.limit(() =>
      stats(investor.CustomerId)
    );
    console.log(investor.UserName, "stats");
    return result;
  }
}
