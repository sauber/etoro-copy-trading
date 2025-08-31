import { Exchange, Instruments } from "@sauber/backtest";
import {
  Dashboard,
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

// Console width
const console_width = 88;

// Generate dashboard and callback
function dashboard(max: number): Status {
  const dashboard: Dashboard = new Dashboard(max, console_width);

  const callback: Status = (
    iterations: number,
    _momentum: number,
    parameters: OptimizerParameters,
    reward: number[],
  ) => console.log(dashboard.render(parameters, iterations, reward));

  return callback;
}

// Attempt to load parameters
let model: Optimize | null = null;
let initialScore: number = 0;
try {
  const [strategy, signal] = await Promise.all([
    loadStrategySettings(repo),
    (await Signal.load(repo)).export(),
  ]);

  model = new Optimize(validation, ranker);
  model.setParameterValues({
    ...strategy,
    ...signal,
  });
  initialScore = model.predict();
  console.log("Initial score:", initialScore);
} catch (_e) {
  // Loading failed, so search for a good starting point
  const epochs = 400;
  console.log(
    `Searching for best starting point from ${epochs} random samples:`,
  );
  model = new Optimize(exchange, ranker);
  model.reset(
    epochs,
    dashboard(epochs),
  );
  console.log("");
}

// Run optimizer and save results
const epochs = 2;
console.log("Optimizing from starting point:");
const epsilon = 0.01;
const _iterations: number = model.optimize(
  epochs,
  epsilon,
  dashboard(epochs),
);
const result = model.getParameterValues();

// Confirm final score
const validationModel = new Optimize(validation, ranker);
validationModel.setParameterValues(result);
const finalScore: number = validationModel.predict();
console.log("Final score:", finalScore);

// Save model only if score improved
if (finalScore > initialScore) {
  const strategy: Settings = model.getStrategySettings();
  console.log("Saved strategy settings: ", strategy);
  await saveStrategy(repo, strategy);

  const settings: Settings = model.getTimerSettings();
  console.log("Saved signal settings: ", settings);
  const signal: Signal = Signal.import(settings);
  await signal.save(repo);
}
