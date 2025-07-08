import { JournaledAsset, CachingBackend, DiskBackend } from "@sauber/journal";
import type { DiscoverFilter, InvestorId } from "📚/repository/types.ts";
import type { DiscoverData } from "📚/repository/discover.ts";
import type { ChartData } from "📚/repository/chart.ts";
import type { PortfolioData } from "📚/repository/portfolio.ts";
import type { StatsData } from "📚/repository/stats.ts";
import { Community } from "📚/repository/community.ts";

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
  discover: await new JournaledAsset<DiscoverData>("discover", repo).last(),
  chart: await new JournaledAsset<ChartData>(n + ".chart", repo).last(),
  portfolio: await new JournaledAsset<PortfolioData>(n + ".portfolio", repo).last(),
  stats: await new JournaledAsset<StatsData>(n + ".stats", repo).last(),
};

export const blacklist = {};
