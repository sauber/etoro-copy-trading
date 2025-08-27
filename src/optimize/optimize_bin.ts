import { Exchange, Instruments } from "@sauber/backtest";
import { Dashboard, Parameters, Status } from "@sauber/optimize";

import { loadRanker } from "📚/ranking/mod.ts";
import { Community, Names, TestCommunity } from "📚/community/mod.ts";
import { makeRepository } from "📚/repository/mod.ts";
import {
  limits as signalInputParameters,
  Settings,
  Settings as Exported,
  Signal,
} from "📚/signal/mod.ts";
import {
  inputParameters as strategyInputParameters,
  Rater,
  saveSettings as saveStrategy,
} from "📚/strategy/mod.ts";

import { loadParameters, ParameterData } from "./loader.ts";
import { Optimize } from "./optimize.ts";

// Repo
const path: string = Deno.args[0];
const repo = makeRepository(path);
const community: Community = new TestCommunity(repo);

// Console width
const console_width = 88;

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

// Generate dashboard and callback
function dashboard(max: number): Status {
  const dashboard: Dashboard = new Dashboard(max, console_width);

  const callback: Status = (
    iterations: number,
    _momentum: number,
    parameters: Parameters,
    reward: number[],
  ) => console.log(dashboard.render(parameters, iterations, reward));

  return callback;
}

// Attempt to load parameters
let model: Optimize | null = null;
let initialScore: number = 0;
try {
  const parameters = await loadParameters(repo);
  model = new Optimize(parameters, ranker);
  initialScore = model.predict(validation);
  console.log("Initial score:", initialScore);
} catch (_e) {
  // Loading failed, so search for a good starting point
  const epochs = 400;
  console.log(
    `Searching for best starting point from ${epochs} random samples:`,
  );
  model = Optimize.generate(exchange, epochs, ranker, dashboard(epochs));
  console.log("");
}

// Run optimizer and save results
const epochs = 100;
console.log("Optimizing from starting point:");
const epsilon = 0.01;
const _iterations: number = model.optimize(
  exchange,
  epochs,
  epsilon,
  dashboard(epochs),
);

// Confirm final score
const finalScore: number = model.predict(validation);
console.log("Final score:", finalScore);

// Save model only if score improved
// TODO: Use Strategy save method
if (finalScore > initialScore) {
  const exported: ParameterData = model.export();

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

  await saveStrategy(repo, strategy);
  console.log("Saved settings: ", exported);
}
