
import { makeRanker, makeTimer } from "📚/trading/raters.ts";
import { InvestorRanking } from "📚/ranking/mod.ts";
import { createTimer, loadTimer, Timing, WeekdayStrategy } from "📚/timing/mod.ts";
import { Bar, Instrument, Strategy } from "@sauber/backtest";
import { ParameterData } from "📚/trading/parameters.ts";
import { Policy } from "./policy.ts";
import { StopLossStrategy } from "./stoploss-strategy.ts";
import { TrailingStrategy } from "./trailing-strategy.ts";
import { UnionStrategy } from "./union-strategy.ts";
import { CascadeStrategy } from "./cascade-strategy.ts";
import { FutureStrategy } from "./future-strategy.ts";
import { LimitStrategy } from "./limit-strategy.ts";
import { RoundingStrategy } from "./rounding-strategy.ts";
import { Loader } from "../trading/loader.ts";
import { Config } from "../config/mod.ts";
import { Backend } from "@sauber/journal";

/** Rater function type
 * Assess ranking instruments, such as timing and prospect
 * Output must be in interval [-1,1]
 * Value 0 is neutral
 * Values in interval (0,1] is positive rating
 * Values in interval [-1,0) is negative rating
 */
export type Rater = (instrument: Instrument, bar: Bar) => number;

/** Generate a strategy from settings, ranking model and timing model */
export function buildStrategy(
  // TODO: Only exempt parameters required for strategy, nothing else
  settings: ParameterData,
  ranker: Rater,
  timer: Rater,
): Strategy {
  const policy: Strategy = new Policy(ranker, timer, settings.position_size);
  const stoploss: Strategy = new StopLossStrategy(settings.stoploss);
  const trailing: Strategy = new TrailingStrategy(settings.stoploss);
  const strategy: Strategy = new UnionStrategy([
    stoploss,
    new CascadeStrategy([
      // TODO: Add an expire strategy for open positions where data is no longer available
      new WeekdayStrategy(settings.weekday),
      new UnionStrategy([
        trailing,
        new CascadeStrategy([
          // TODO: FutureStrategy only applies for backtesting
          new FutureStrategy(180),
          policy,
          new LimitStrategy(settings.limit),
          new RoundingStrategy(200),
        ]),
      ]),
    ]),
  ]);

  return strategy;
}

/** Strategy with parameters and models loaded from repository */
export async function loadStrategy(repo: Backend): Promise<Strategy> {
  const config = new Config(repo);
  const settings: ParameterData = await config.get("trading") as ParameterData;

  const rankingModel = new InvestorRanking(repo);
  const ranker: Rater = makeRanker(rankingModel);

  const timer: Rater = await loadTimer(repo);

  return buildStrategy(settings, ranker, timer);
}
