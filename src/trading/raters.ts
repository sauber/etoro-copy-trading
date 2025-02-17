import { Bar, Instrument } from "@sauber/backtest";
import { Ranking } from "📚/ranking/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Timing } from "📚/timing/mod.ts";

/** Rater function type
 * Assess ranking or timing of instruments
 * Output must be in interval [-1,1]
 * Value 0 is neutral
 * Values in interval (0,1] is positive rating
 * Values in interval [-1,0) is negative rating
 */
export type Rater = (instrument: Instrument, bar: Bar) => number;

/** Given a Ranking model, create callback to evaluate instrument at bar */
export function makeRanker(ranking: Ranking): Rater {
  const ranker = (instrument: Instrument, bar: Bar) =>
    ("investor" in instrument)
      // Ensure value is in range [-1,1]
      ? Math.tanh(ranking.predict(instrument.investor as Investor, bar))
      // No ranking of non-investor instruments
      : 0;
  return ranker;
}

/** Given a Timing model, create callback to evaluate instrument at bar */
export function makeTimer(timing: Timing): Rater {
  const timer = (instrument: Instrument, bar: Bar) => {
    if (instrument.active(bar + 2)) {
      return timing.predict(instrument, bar);
    } else return 0;
  };
  return timer;
}
