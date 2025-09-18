import {
  ChartResults,
  DiscoverParameters,
  DiscoverResults,
  PortfolioResults,
  StatsResults,
} from "@sauber/etoro-investors";
import type { InvestorId } from "../repository/mod.ts";

export interface FetchBackend {
  /** Search for investors matching criteria */
  discover(filter: Partial<DiscoverParameters>): Promise<DiscoverResults>;

  /** Fetch a chart object for investor  */
  chart(investor: InvestorId): Promise<ChartResults>;

  /** Fetch list of investments for investor  */
  portfolio(investor: InvestorId): Promise<PortfolioResults>;

  /** Fetch stats of investor  */
  stats(investor: InvestorId): Promise<StatsResults>;
}
