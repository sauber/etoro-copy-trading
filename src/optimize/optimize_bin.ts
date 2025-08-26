import { Exchange, Instruments } from "@sauber/backtest";
import { Dashboard, Parameters, Status } from "@sauber/optimize";

import { loadRanker } from "📚/ranking/mod.ts";
import { Community, Names, TestCommunity } from "📚/community/mod.ts";
import { makeRepository } from "📚/repository/mod.ts";
import {
  limits as signalInputParameters,
  Settings,
  Settings as Exported,
} from "📚/signal/mod.ts";
import {
  inputParameters as strategyInputParameters,
  Rater,
  saveSettings as saveStrategy,
} from "📚/strategy/mod.ts";

import { loadParameters, ParameterData } from "./loader.ts";
import { Optimize } from "./optimize.ts";
import { Signal } from "../signal/signal.ts";

// Repo
const path: string = Deno.args[0];
const repo = makeRepository(path);
const community: Community = new TestCommunity(repo);

// Load a sample of random investors
async function investors(count: number): Promise<Instruments> {
  const names: Names = await community.samples(count);
  return community.load(names);
}

// Ranking Model
const ranker: Rater = await loadRanker(repo);

// Load training data
const training_count: number = 800;
const instruments: Instruments = await investors(training_count);
console.log("Testing Instruments loaded:", instruments.length);
const spread = 0.001;
const exchange: Exchange = new Exchange(instruments, spread);

// Load Validation data
const validation_count: number = 80;
const validationInstruments: Instruments = await investors(validation_count);
console.log("Validation Instruments loaded:", validationInstruments.length);
const validation: Exchange = new Exchange(instruments, spread);

// Attempt to load parameters
let model: Optimize | null = null;
let initialScore: number = 0;
try {
  const parameters = await loadParameters(repo);
  model = new Optimize(parameters, ranker);
  // console.log("Loaded parameters:", parameters);
  initialScore = model.predict(validation);
  console.log("Initial score:", initialScore);
} catch (_e) {
  // Loading failed, so search for a good starting point
  // TODO: Suspect repeat defaults are tested instead of random
  model = Optimize.generate(exchange, 150, ranker);
  console.log("Best random starting point:", model.export());
}

// Dashboard
const epochs = 100;
const console_width = 88;
const dashboard: Dashboard = new Dashboard(epochs, console_width);
const status: Status = (
  iterations: number,
  _momentum: number,
  parameters: Parameters,
  reward: number[],
) => console.log(dashboard.render(parameters, iterations, reward));

// Run optimizer and save results
const epsilon = 0.01;
const _iterations: number = model.optimize(exchange, epochs, epsilon, status);

// Confirm final score
const finalScore: number = model.predict(validation);
console.log("Final score:", finalScore);

// Save model only if score improved
// TODO: Use Strategy save method
if (finalScore > initialScore) {
  const exported: ParameterData = model.export();
  // await config.set(modelAssetName, exported);

  // Pick out signal parameters and save
  const settings: Settings = Object.fromEntries(
    Object.entries(signalInputParameters).map((
      [key, _limit],
    ) => [key, exported[key]]),
  );
  const signal: Signal = Signal.import(settings);
  await signal.save(repo);

  // Pick out strategy parameters and save
  const strategy: Exported = Object.fromEntries(
    Object.entries(strategyInputParameters).map((
      [key, _limit],
    ) => [key, exported[key]]),
  );

  // console.log({signal, strategy});

  await saveStrategy(repo, strategy);
  console.log("Saved settings: ", exported);
}
