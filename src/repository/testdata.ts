import { CachingBackend, DiskBackend, JournaledAsset } from "@sauber/journal";
import type { InvestorId } from "📚/repository/types.ts";
import { Community } from "📚/community/community.ts";
import {
  ChartResults,
  DiscoverResults,
  PortfolioResults,
  StatsResults,
} from "@sauber/etoro-investors";

const path = "testdata";
export const repo = new CachingBackend(new DiskBackend(path));
export const community = new Community(repo);
export const investorId: InvestorId = {
  CustomerId: 4657429,
  UserName: "GainersQtr",
};

// Most recent asset data
const n = investorId.UserName;
export const testAssets = {
  discover: await new JournaledAsset<DiscoverResults>("discover", repo).last(),
  chart: await new JournaledAsset<ChartResults>(n + ".chart", repo).last(),
  portfolio: await new JournaledAsset<PortfolioResults>(n + ".portfolio", repo)
    .last(),
  stats: await new JournaledAsset<StatsResults>(n + ".stats", repo).last(),
};

export const blacklist = {};
