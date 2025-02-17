import { Instrument, StrategyContext } from "@sauber/backtest";
import { Assets } from "📚/assets/mod.ts";
import { path } from "📚/assets/testdata.ts";
import { Loader } from "📚/trading/loader.ts";
import { InvestorRanking } from "📚/ranking/mod.ts";

export const assets = Assets.disk(path);
export const investor = await assets.community.any();
export const rankModel: InvestorRanking = assets.ranking;
await rankModel.load();
const loader = new Loader(assets);
export const context: StrategyContext = await loader.strategyContext();
export const instrument = (await loader.instrumentSamples(1))[0];
export const timeModel = await assets.timing();

// Calculate a dummy ranking score based on length of username.
export const test_ranking = (instr: Instrument) => {
  const score: number = (instr.symbol.length - 11) * 0.2;
  return score;
};

// Calculate a dummy timing score based on first letter
export const test_timing = (instr: Instrument) => {
  const score: number = (instr.symbol.toUpperCase().charCodeAt(0) - 78) / 13;
  return score;
};
