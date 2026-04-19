import { Backend } from "@sauber/journal";
import { Instrument } from "@sauber/backtest";

import { Rater } from "📚/strategy/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Tick } from "📚/tick/mod.ts";

import { InvestorRanking } from "./investor-ranking.ts";
import { Ranking } from "./mod.ts";
import { RankingCache } from "./ranking-cache.ts";

/** Given a Ranking model, create callback to evaluate instrument at bar */
export function createRanker(ranking: Ranking): Rater {
  const ranker = (instrument: Instrument, tick: Tick): number => {
    const rank: number = ("stats" in instrument)
      ? ranking.predict(instrument as Investor, tick)
      // No ranking of non-investor instruments
      : 0;

    if (isNaN(rank)) {
      throw new Error(`NaN ranking for ${instrument.symbol} at tick ${tick}`);
    }
    // Ensure range of result is ]-1,1[
    return Math.tanh(rank);
  };
  return ranker;
}

/** Load model from repo and create ranker */
export async function loadRanker(repo: Backend): Promise<Rater> {
  const rankingModel = new InvestorRanking(repo);
  await rankingModel.load();
  const cacher: Ranking = new RankingCache(rankingModel);
  const ranker: Rater = createRanker(cacher);
  return ranker;
}
