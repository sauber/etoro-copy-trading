import { Exchange, Instruments } from "@sauber/backtest";
import {
  Dashboard,
  Parameters,
  Parameters as OptimizerParameters,
  Status,
} from "@sauber/optimize";

import { loadRanker } from "📚/ranking/mod.ts";
import { Community, Names, TestCommunity } from "📚/community/mod.ts";
import { makeRepository } from "📚/repository/mod.ts";
import { Settings, Signal } from "📚/signal/mod.ts";
import {
  loadSettings as loadStrategySettings,
  Rater,
  saveSettings as saveStrategy,
} from "📚/strategy/mod.ts";

import { Optimize } from "./optimize.ts";
import { exit } from "node:process";

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
const instruments: Instruments = (await investors(training_count))
  .filter((instrument) => instrument.series.length >= 200);
console.log("Testing Instruments loaded:", instruments.length);
const spread = 0.001;
const exchange: Exchange = new Exchange(instruments, spread);
const trainingModel = new Optimize(exchange, ranker);

// Load Validation data
const validation_count: number = 80;
const validationInstruments: Instruments = (await investors(validation_count))
  .filter((instrument) => instrument.series.length >= 200);
console.log("Validation Instruments loaded:", validationInstruments.length);
const validation: Exchange = new Exchange(instruments, spread);
const validationModel = new Optimize(validation, ranker);

// Console width
const console_width = 88;

// Generate dashboard and callback
function dashboard(max: number, parameters: OptimizerParameters): Status {
  const dashboard: Dashboard = new Dashboard(parameters, max, console_width);

  const callback: Status = (
    iterations: number,
    momentum: number,
    _parameters: OptimizerParameters,
    reward: number[],
  ) => console.log(dashboard.render(iterations, reward, momentum));

  return callback;
}

// Attempt to load parameters
let initialScore: number = 0;
try {
  const strategy: Settings = await loadStrategySettings(repo);
  const signal: Settings = (await Signal.load(repo)).export();
  validationModel.setParameterValues({
    ...strategy,
    ...signal,
  });

  initialScore = validationModel.predict();
  console.log("Initial score:", initialScore);
} catch (_e) {
  // Loading failed, so search for a good starting point
  const epochs = 400; // 400
  console.log(
    `Searching for best starting point from ${epochs} random samples:`,
  );
  trainingModel.reset(
    epochs,
    dashboard(epochs, trainingModel.parameters),
  );
  console.log("");
}

// Run optimizer and save results
const epochs = 100; // 100
console.log("Optimizing from starting point:");
const epsilon = 0.01;
const _iterations: number = trainingModel.optimize(
  epochs,
  epsilon,
  dashboard(epochs, trainingModel.parameters),
);
const result = trainingModel.getParameterValues();

// Retrieve final score from validation set
validationModel.setParameterValues(result);
const finalScore: number = validationModel.predict();
console.log("Final score:", finalScore);

// Confirm if best score also applies to validation set and is higher than final score
validationModel.setParameterValues(trainingModel.best);
const bestScore: number = validationModel.predict();
console.log("Best score:", bestScore);

// No improvements found
if (initialScore >= finalScore && initialScore >= bestScore) {
  console.log("No improvements found.");
  exit(0);
}

const savingModel = (finalScore > bestScore) ? trainingModel : validationModel;

// Save final/best score
const strategy: Settings = savingModel.getStrategySettings();
console.log("Saved strategy final settings: ", strategy);
await saveStrategy(repo, strategy);

const settings: Settings = savingModel.getTimerSettings();
console.log("Saved signal final settings: ", settings);
const signal: Signal = Signal.import(settings);
await signal.save(repo);
