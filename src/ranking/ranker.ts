import { Backend } from "@sauber/journal";
import { Rater } from "📚/trading/raters.ts";
import { InvestorRanking } from "📚/ranking/mod.ts";
import { Bar, Instrument } from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";
import { Ranking } from "📚/ranking/mod.ts";

/** Given a Ranking model, create callback to evaluate instrument at bar */
export function createRanker(ranking: Ranking): Rater {
  const ranker = (instrument: Instrument, bar: Bar) =>
    ("stats" in instrument)
      // Ensure value is in range [-1,1]
      ? Math.tanh(ranking.predict(instrument as Investor, bar))
      // No ranking of non-investor instruments
      : 0;
  return ranker;
}

/** Load model from repo and create ranker */
export async function loadRanker(repo: Backend): Promise<Rater> {
  const rankingModel = new InvestorRanking(repo);
  await rankingModel.load();
  const ranker: Rater = createRanker(rankingModel);
  return ranker;
}
