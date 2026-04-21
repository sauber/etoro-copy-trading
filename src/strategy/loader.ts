import { Instrument, Strategy, Tick } from "@sauber/backtest";
import { Backend } from "@sauber/journal";

import { Config } from "📚/config/mod.ts";
import { loadRanker } from "📚/ranking/mod.ts";
import { CachedSignal, Settings, Signal } from "📚/signal/mod.ts";
import { Timeline, Weekday } from "📚/tick/mod.ts";
import { Community } from "📚/community/mod.ts";
import { trading } from "📚/strategy/trading.ts";
import { DELAY } from "📚/strategy/delay.ts";
import { Input, Rater, validation } from "📚/strategy/parameters.ts";

const assetName = "trading";

/** Load strategy parameter values from repository */
export async function loadSettings(repo: Backend): Promise<Input> {
  const config = new Config(repo);
  const settings = await config.get(assetName) as Input;
  if (!validation(settings)) throw new Error("Invalid strategy settings");
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
export async function loadStrategy(
  repo: Backend,
  ticks_required: number,
): Promise<Strategy> {
  const [settings, ranker, timer] = await Promise.all([
    loadSettings(repo),
    loadRanker(repo, ticks_required),
    loadTimer(repo),
  ]);

  const community = new Community(repo);
  const timeline: Timeline = await community.timeline();
  const startWeekday: Weekday = timeline.weekday(0);

  return trading(settings, ranker, timer, startWeekday, 180);
}

/** Create a prediction wrapper */
function createRater(signal: Signal): Rater {
  const timer = (instrument: Instrument, tick: Tick) => {
    const effective: Tick = tick - DELAY;
    const value = instrument.has(effective)
      ? signal.predict(instrument, effective)
      : 0;
    return value;
  };
  return timer;
}

/** Create instance of signal from specific settings */
export function createTimer(params: Settings): Rater {
  const signal: Signal = CachedSignal.import(params);
  return createRater(signal);
}

/** Create instance of signal from saved settings */
export async function loadTimer(repo: Backend): Promise<Rater> {
  const signal: Signal = await CachedSignal.load(repo);
  return createRater(signal);
}
