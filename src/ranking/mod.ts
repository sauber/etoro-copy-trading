import { Tick } from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";

/** Rank of investor at bar as single numeric value */
export interface Ranking {
  // TODO: Skip the predict function and return an anonymous function
  predict: (investor: Investor, tick: Tick) => number;
}

export * from "./ranker.ts";
