import { Backend } from "@sauber/journal";
import { Bar, Instrument, Strategy } from "@sauber/backtest";
import { loadTimer } from "📚/signal/mod.ts";
import { loadRanker } from "../ranking/mod.ts";
import { Limits } from "../optimize/parameters.ts";
import { Config } from "../config/mod.ts";
import { Policy } from "./policy.ts";
import { StopLossStrategy } from "./stoploss-strategy.ts";
import { TrailingStrategy } from "./trailing-strategy.ts";
import { UnionStrategy } from "./union-strategy.ts";
import { CascadeStrategy } from "./cascade-strategy.ts";
import { FutureStrategy } from "./future-strategy.ts";
import { LimitStrategy } from "./limit-strategy.ts";
import { RoundingStrategy } from "./rounding-strategy.ts";
import { WeekdayStrategy } from "./weekday-strategy.ts";

/** Rater function type
 * Assess ranking instruments, such as timing and prospect
 * Output must be in interval [-1,1]
 * Value 0 is neutral
 * Values in interval (0,1] is positive rating
 * Values in interval [-1,0) is negative rating
 */
export type Rater = (instrument: Instrument, bar: Bar) => number;

const assetName = "trading";

/** Parameters required by Strategy */
export type StrategyParameters = {
  position_size: number;
  stoploss: number;
  limit: number;
  weekday: number;
};

export const inputParameters: Limits = {
  weekday: { min: 0, max: 6, default: 1, int: true },
  position_size: { min: 0.005, max: 0.2, default: 0.07 },
  stoploss: { min: 0.05, max: 0.95, default: 0.85 },
  limit: { min: 1, max: 15, default: 3, int: true },
};
type Input = Record<keyof typeof inputParameters, number>;

/** Assert that parameters are within limits */
function validation(settings: Input): boolean {
  const limits = inputParameters;
  for (const [name, limit] of Object.entries(limits)) {
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
  // TODO: Only accept parameters required for strategy, nothing else
  settings: Input,
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

/** Load strategy parameter values from repository */
export async function loadSettings(repo: Backend): Promise<Input> {
  const config = new Config(repo);
  const settings = await config.get(assetName) as Input;
  if (!validation(settings)) return {};
  return settings;
}

/** Save strategy parameter values to repository */
export async function saveSettings(
  repo: Backend,
  settings: Input,
): Promise<void> {
  if (!validation(settings)) return;
  const config = new Config(repo);
  await config.set(assetName, settings);
}

/** Strategy with parameters and models loaded from repository */
export async function loadStrategy(repo: Backend): Promise<Strategy> {
  // const config = new Config(repo);
  // const settings = await config.get(assetName) as Input;
  // const ranker: Rater = await loadRanker(repo);
  // const timer: Rater = await loadTimer(repo);
  const [ settings, ranker, timer ] = await Promise.all([
    loadSettings(repo),
    loadRanker(repo),
    loadTimer(repo),
  ]);

  return buildStrategy(settings, ranker, timer);
}

/** Save strategy parameters to repository */
// export async function saveStrategy(
//   repo: Backend,
//   settings: Record<string, number>,
// ): Promise<void> {
//   // Save only settings as defined in Limits
//   const limits = inputParameters;
//   const keys = Object.keys(limits);
//   const valid: Input = {};
//   for (const key of keys) {
//     valid[key] = settings[key];
//   }
//   const config = new Config(repo);
//   await config.set(assetName, valid);
// }
