import { Backend } from "@sauber/journal";
import { Bar, Instrument } from "@sauber/backtest";
import { Rater } from "../strategy/mod.ts";
import { Config } from "../config/mod.ts";
import { Exported } from "./signal.ts";
import { CachedSignal } from "./signal-cache.ts";
import { inputParameters } from "./indicator.ts";

const assetName: string = "signal";
const DELAY: number = 2;

/** Create instance of signal and create a prediction wrapper */
export function createTimer(params: Exported): Rater {
  const signal = CachedSignal.import(params);

  const timer = (instrument: Instrument, bar: Bar) => {
    const effective: Bar = bar + DELAY;
    if (!instrument.has(effective)) return 0;
    return signal.predict(instrument, effective);
  };
  return timer;
}

/** Confirm all parameters are present, and nothing else is present */
function validate(settings: Exported): boolean {
  for (const key of Object.keys(settings)) {
    if (!(key in inputParameters)) {
      throw new Error(`Unknown parameter ${key}`);
    }
  }
  for (const key of Object.keys(inputParameters)) {
    if (!(key in settings)) {
      throw new Error(`Missing parameter ${key}`);
    }
  }
  return true;
}

/** Load signal parameter values from repository */
export async function loadSettings(repo: Backend): Promise<Exported> {
  const config = new Config(repo);
  const settings = await config.get(assetName) as Exported;
  if (!validate(settings)) return {};
  return settings;
}

/** Load signal parameter values from repository */
export async function loadTimer(repo: Backend): Promise<Rater> {
  return createTimer(await loadSettings(repo));
}

/** Save signal parameters to repository */
export async function saveSettings(
  repo: Backend,
  settings: Exported,
): Promise<void> {
  // console.log("Saving settings:", assetName, settings);
  if (!validate(settings)) return;
  // console.log("Saving settings:", settings);
  const config = new Config(repo);
  await config.set(assetName, settings);
}
