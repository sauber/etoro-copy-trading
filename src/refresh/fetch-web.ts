import { RateLimit } from "@sauber/ratelimit";
import { StorableObject } from "@sauber/journal";
import {
  chart,
  ChartResults,
  discover,
  DiscoverParameters,
  DiscoverResults,
  portfolio,
  PortfolioResults,
  stats,
  StatsResults,
} from "@sauber/etoro-investors";

import type { InvestorId } from "📚/repository/mod.ts";

import { FetchBackend } from "./fetch-backend.ts";

/** Fetch objects from eToro API using rate limit */
export class FetchWebBackend implements FetchBackend {
  private readonly ratelimit: RateLimit;

  constructor(rate: number) {
    this.ratelimit = new RateLimit(rate);
  }

  private async _fetch<T extends StorableObject>(
    fn: () => Promise<T>,
  ): Promise<T> {
    return await this.ratelimit.limit(fn);
  }

  public discover(
    filter: Partial<DiscoverParameters>,
  ): Promise<DiscoverResults> {
    return this._fetch(() => discover(filter));
  }

  public chart(investor: InvestorId): Promise<ChartResults> {
    return this._fetch(() => chart(investor.UserName));
  }

  public portfolio(investor: InvestorId): Promise<PortfolioResults> {
    return this._fetch(() => portfolio(investor.CustomerId));
  }

  public stats(investor: InvestorId): Promise<StatsResults> {
    return this._fetch(() => stats(investor.CustomerId));
  }
}
