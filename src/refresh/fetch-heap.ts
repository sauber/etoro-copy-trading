import {
  ChartResults,
  DiscoverParameters,
  DiscoverResults,
  PortfolioResults,
  StatsResults,
} from "@sauber/etoro-investors";

import type { InvestorId } from "📚/repository/mod.ts";

import { FetchBackend } from "./fetch-backend.ts";

type Assets = {
  discover: DiscoverResults;
  chart: ChartResults;
  portfolio: PortfolioResults;
  stats: StatsResults;
};

/** Test class to fetch from variables instead of website */
export class FetchHeapBackend implements FetchBackend {
  constructor(private readonly assets: Assets) {}

  public discover(_filter: Partial<DiscoverParameters>): Promise<DiscoverResults> {
    return Promise.resolve(this.assets.discover);
  }

  public chart(_investor: InvestorId): Promise<ChartResults> {
    return Promise.resolve(this.assets.chart);
  }

  public portfolio(_investor: InvestorId): Promise<PortfolioResults> {
    return Promise.resolve(this.assets.portfolio);
  }

  public stats(_investor: InvestorId): Promise<StatsResults> {
    return Promise.resolve(this.assets.stats);
  }
}
