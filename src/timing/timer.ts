import { Asset, Backend } from "@sauber/journal";
import { Rater } from "../trading/raters.ts";
import { Stochastic as Indicator } from "./stochastic-signal.ts";
import { Bar, Instrument } from "@sauber/backtest";
import { Parameters } from "@sauber/optimize";
import { Signals } from "./signals.ts";

type Settings = Record<string, number>;
const assetName: string = "timing";
const parameters: Parameters = Indicator.parameters();

/** Create a function to provide timing signals for instruments */
export function createTimer(setting: Settings): Rater {
  // Validate all required parameters are present
  for (const param of parameters) {
    if (!(param.name in setting)) {
      throw new Error(`Missing required parameter: ${param.name}`);
    }
  }

  // Create an instance of the indicator with the provided settings
  const indicator = new Indicator(
    Object.assign({}, ...parameters.map((p) => [p.name, setting[p.name]])),
  );

  // Create Signals instance with the indicator
  const signals: Signals = new Signals(indicator);

  // Create timer function that uses the Signals instance
  const timer = (instrument: Instrument, bar: Bar) =>
    signals.signal(instrument, bar);
  return timer;
}

/** Loading settings from asset, or create asset if it doesn’t exist or is incomplete */
export async function loadTimer(repo: Backend): Promise<Rater> {
  // Asset is used to store parameters for indicator
  const asset = new Asset<Settings>(assetName, repo);

  // Check if asset exists and retrieve settings, or create blank settings
  const settings: Settings = (await asset.exists())
    ? await asset.retrieve()
    : {};

  // Check if all required parameters are present
  let missing: boolean = false;
  for (const param of parameters) {
    if (!(param.name in settings)) {
      settings[param.name] = param.value;
      missing = true;
    }
  }
  if (missing) await asset.store(settings);
  return createTimer(settings);
}

/** Generate timing function with random parameters */
export function randomTimer(): Rater {
  // Generate random settings for the indicator
  const randomSettings: Settings = {};
  for (const param of parameters) {
    randomSettings[param.name] = param.random;
  }
  return createTimer(randomSettings);
}
