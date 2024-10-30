import { DiskBackend, Asset, CachingBackend } from "../storage/mod.ts";
import type { InvestorId, DiscoverFilter } from "./mod.ts";
import type { DiscoverData } from "./discover.ts";
import type { ChartData } from "./chart.ts";
import type { PortfolioData } from "./portfolio.ts";
import type { StatsData } from "./stats.ts";
import { Community } from "./community.ts";

const path = "testdata";
export const repo = new CachingBackend(new DiskBackend(path));
export const community = new Community(repo);
export const investorId: InvestorId = {
  CustomerId: 4657429,
  UserName: "GainersQtr",
};
export const discoverFilter: DiscoverFilter = { risk: 4, daily: 6, weekly: 11 };

// Most recent asset data
const n = investorId.UserName;
export const testAssets = {
  discover: await new Asset<DiscoverData>("discover", repo).last(),
  chart: await new Asset<ChartData>(n + ".chart", repo).last(),
  portfolio: await new Asset<PortfolioData>(n + ".portfolio", repo).last(),
  stats: await new Asset<StatsData>(n + ".stats", repo).last(),
};

export const blacklist = {};
