import { Backend } from "@sauber/journal";
import { Rater } from "📚/strategy/mod.ts";
import { InvestorRanking } from "📚/ranking/investor-ranking.ts";
import { Instrument, Tick } from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";
import { Ranking } from "📚/ranking/mod.ts";
import { RankingCache } from "./ranking-cache.ts";
// import { DateFormat, Timeline } from "📚/tick/mod.ts";
// import { Community } from "📚/community/mod.ts";

/** Given a Ranking model, create callback to evaluate instrument at bar */
export function createRanker(ranking: Ranking): Rater {
  const ranker = (instrument: Instrument, tick: Tick): number => {
    const rank: number = ("stats" in instrument)
      // Ensure value is in range [-1,1]
      // ? Math.tanh(ranking.predict(instrument as Investor, tick))
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
  // const start: DateFormat = await (new Community(repo).chartStart());
  // const ticker = new Timeline(start);
  const rankingModel = new InvestorRanking(repo);
  await rankingModel.load();
  const cacher: Ranking = new RankingCache(rankingModel);
  const ranker: Rater = createRanker(cacher);
  return ranker;
}
