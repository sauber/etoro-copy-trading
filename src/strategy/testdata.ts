import { Backend } from "@sauber/journal";
import { Context } from "../trading/context.ts";
import { Instrument } from "@sauber/backtest";
import { makeRepository } from "../repository/mod.ts";

const path = "testdata";
const repo: Backend = makeRepository(path);
const loader = new Context(repo);
export const instrument: Instrument = (await loader.anyInstrument());
export const context = await loader.strategyContext();

// Calculate a dummy ranking score based on length of username.
export const test_ranking = (instr: Instrument) => {
  const score: number = (instr.symbol.length - 11) * 0.2;
  return score;
};

// Calculate a dummy timing score based on first letter
export const test_timing = (instr: Instrument) => {
  const score: number = -(instr.symbol.toUpperCase().charCodeAt(0) - 78) / 13;
  return score;
};
