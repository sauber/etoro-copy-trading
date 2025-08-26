import { Bar, Instrument } from "@sauber/backtest";
import { CachedSignal, Settings, Signal } from "../signal/mod.ts";
import { Backend } from "@sauber/journal";
import { Rater } from "./strategy.ts";

// Number of bars delayed in timing
const DELAY = 2;

/** Create a prediction wrapper */
function createRater(signal: Signal): Rater {
  const timer = (instrument: Instrument, bar: Bar) => {
    const effective: Bar = bar + DELAY;
    if (!instrument.has(effective)) return 0;
    return signal.predict(instrument, effective);
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
