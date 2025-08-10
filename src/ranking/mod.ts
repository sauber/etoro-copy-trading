import { Bar } from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";

// export * from "📚/ranking/investor-ranking.ts";
// export * from "📚/ranking/ranking-cache.ts";
// export * from "📚/ranking/ranking-strategy.ts";
// export * from "📚/ranking/investor-ranking.ts";

export interface Ranking {
  // Rank of investor at bar as single numeric value
  predict: (investor: Investor, bar: Bar) => number;
}

export * from "./ranker.ts";