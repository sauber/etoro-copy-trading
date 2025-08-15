import { Backend } from "@sauber/journal";
import { Rater } from "../strategy/mod.ts";
import { Parameters, Stochastic as Indicator } from "./stochastic-signal.ts";
import { Bar, Instrument } from "@sauber/backtest";
import { Parameters as TrainingParameters } from "@sauber/optimize";
import { Signals } from "./signals.ts";
import { Config } from "../config/mod.ts";

// type Settings = Partial<Indicator>;
const assetName: string = "signal";
const parameters: TrainingParameters = Indicator.parameters();

/** Create a function to provide timing signals for instruments */
export function createTimer(settings: Parameters): Rater {
  // Validate all required parameters are present
  for (const param of parameters) {
    if (!(param.name in settings)) {
      throw new Error(`Missing required parameter: ${param.name}`);
    }
  }

  // Create an instance of the indicator with the provided settings
  // const params = Object.fromEntries(
  //   parameters.map((p) => [p.name, setting[p.name]]),
  // ) as Parameters;
  const indicator = new Indicator(settings);

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
  // const asset = new Asset<Settings>(assetName, repo);

  // Check if asset exists and retrieve settings, or create blank settings
  const config = new Config(repo);
  const settings = await config.get(assetName) as Parameters;

  // Check if all required parameters are present
  // let missing: boolean = false;
  // for (const param of parameters) {
  //   if (!(param.name in settings)) {
  //     settings[param.name] = param.value;
  //     missing = true;
  //   }
  // }
  // if (missing) await asset.store(settings);
  return createTimer(settings);
}

/** Save signal parameters to repository */
export async function saveTimer(
  repo: Backend,
  settings: Parameters,
): Promise<void> {
  const config = new Config(repo);
  await config.set(assetName, settings);
}

/** Generate timing function with random parameters */
export function randomTimer(): Rater {
  // Generate random settings for the indicator
  const randomSettings: Parameters = {
    window: parameters.filter((p) => p.name == "window")[0].random,
    smoothing: parameters.filter((p) => p.name == "smoothing")[0].random,
    buy: parameters.filter((p) => p.name == "buy")[0].random,
    sell: parameters.filter((p) => p.name == "sell")[0].random,
  };
  return createTimer(randomSettings);
}
