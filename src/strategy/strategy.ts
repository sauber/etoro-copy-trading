import { WeekdayStrategy } from "./weekday-strategy.ts";
import { loadTimer } from "📚/signal/mod.ts";
import { Bar, Instrument, Strategy } from "@sauber/backtest";
import { Policy } from "./policy.ts";
import { StopLossStrategy } from "./stoploss-strategy.ts";
import { TrailingStrategy } from "./trailing-strategy.ts";
import { UnionStrategy } from "./union-strategy.ts";
import { CascadeStrategy } from "./cascade-strategy.ts";
import { FutureStrategy } from "./future-strategy.ts";
import { LimitStrategy } from "./limit-strategy.ts";
import { RoundingStrategy } from "./rounding-strategy.ts";
import { Config } from "../config/mod.ts";
import { Backend } from "@sauber/journal";
import { loadRanker } from "../ranking/mod.ts";
import { IntegerParameter, Parameter } from "@sauber/optimize";

/** Rater function type
 * Assess ranking instruments, such as timing and prospect
 * Output must be in interval [-1,1]
 * Value 0 is neutral
 * Values in interval (0,1] is positive rating
 * Values in interval [-1,0) is negative rating
 */
export type Rater = (instrument: Instrument, bar: Bar) => number;

/** Parameters required by Strategy */
export type StrategyParameters = {
  position_size: number;
  stoploss: number;
  limit: number;
  weekday: number;
};

/** Required input to signal function */
export type Parameters = [
  IntegerParameter,
  Parameter,
  Parameter,
  IntegerParameter,
];

/** List of parameters used by signal and default values */
export const parameters = (): Parameters => [
  new IntegerParameter("weekday", 0, 6, 1),
  new Parameter("position_size", 0.005, 0.2, 0.07),
  new Parameter("stoploss", 0.05, 0.95, 0.85),
  new IntegerParameter("limit", 1, 15, 3),
];

/** Generate parameters from custom values */
export const makeParameters = (
  weekday: number,
  position_size: number,
  stoploss: number,
  limit: number,
): Parameters => [
  new IntegerParameter("weekday", 0, 6, weekday),
  new Parameter("position_size", 0.005, 0.2, position_size),
  new Parameter("stoploss", 0.05, 0.95, stoploss),
  new IntegerParameter("limit", 1, 15, limit),
];

/** Assert that parameters are within limits */
function validation(settings: StrategyParameters): boolean {
  const limits = parameters();
  for (const limit of limits) {
    const name = limit.name as keyof StrategyParameters;
    const value = settings[name];

    if (value === undefined) throw new Error(`Missing parameter ${name}`);

    if (value < limit.min || value > limit.max) {
      throw new Error(
        `Parameter ${name} out of range [${limit.min}, ${limit.max}]: ${value}`,
      );
    }
  }

  return true;
}

/** Generate a strategy from settings, ranking model and timing model */
export function buildStrategy(
  // TODO: Only exempt parameters required for strategy, nothing else
  settings: StrategyParameters,
  ranker: Rater,
  timer: Rater,
): Strategy {
  validation(settings);
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
  const settings = await config.get("trading") as StrategyParameters;
  const ranker: Rater = await loadRanker(repo);
  const timer: Rater = await loadTimer(repo);

  return buildStrategy(settings, ranker, timer);
}
