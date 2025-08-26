import { Bar, Instrument } from "@sauber/backtest";
import { Backend } from "@sauber/journal";
import { CachedSignal, Settings, Signal } from "../signal/mod.ts";
import { Rater } from "./strategy.ts";
import { DELAY } from "./context.ts";

/** Create a prediction wrapper */
function createRater(signal: Signal): Rater {
  const timer = (instrument: Instrument, bar: Bar) => {
    const effective: Bar = bar + DELAY;
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
