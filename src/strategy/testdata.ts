import { Backend } from "@sauber/journal";
import { Bar, Instrument } from "@sauber/backtest";
import { Context } from "./context.ts";
import { makeTestRepository } from "../repository/mod.ts";
import { Rater } from "./mod.ts";

const repo: Backend = makeTestRepository();
const loader = new Context(repo);
export const instrument: Instrument = await loader.anyInstrument();
export const context = await loader.strategyContext();

// Calculate a dummy ranking score based on length of username.
export const test_ranking: Rater = (instr: Instrument, _bar: Bar) => {
  const score: number = (instr.symbol.length - 11) * 0.2;
  return score;
};

// Calculate a dummy timing score based on first letter
export const test_timing: Rater = (instr: Instrument, _bar: Bar) => {
  const score: number = -(instr.symbol.toUpperCase().charCodeAt(0) - 78) / 13;
  return score;
};
