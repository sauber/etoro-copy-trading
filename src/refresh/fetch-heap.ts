import type { ChartData } from "📚/repository/chart.ts";
import type { DiscoverData } from "📚/repository/discover.ts";
import type { PortfolioData } from "📚/repository/portfolio.ts";
import type { StatsData } from "📚/repository/stats.ts";

import { FetchBackend } from "📚/repository/types.ts";
import type { DiscoverFilter, InvestorId } from "📚/repository/types.ts";

type Assets = {
  discover: DiscoverData;
  chart: ChartData;
  portfolio: PortfolioData;
  stats: StatsData;
};

/** Test class to fetch from variables instead of website */
export class FetchHeapBackend implements FetchBackend {
  constructor(private readonly assets: Assets) {}

  public discover(_filter: DiscoverFilter): Promise<DiscoverData> {
    return Promise.resolve(this.assets.discover);
  }

  public chart(_investor: InvestorId): Promise<ChartData> {
    return Promise.resolve(this.assets.chart);
  }

  public portfolio(_investor: InvestorId): Promise<PortfolioData> {
    return Promise.resolve(this.assets.portfolio);
  }

  public stats(_investor: InvestorId): Promise<StatsData> {
    return Promise.resolve(this.assets.stats);
  }
}
