import { Exchange, Instruments } from "@sauber/backtest";
import { Dashboard, Parameters, Status } from "@sauber/optimize";
import { Optimize } from "./optimize.ts";
import { Rater } from "./raters.ts";
import { loadRanker } from "📚/ranking/mod.ts";
import { ParameterData } from "./parameters.ts";
import { Community, Names, TestCommunity } from "../community/mod.ts";
import { makeRepository } from "../repository/mod.ts";
import { Config } from "../config/config.ts";


const modelAssetName = "trading";

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

// Load Parameters into model
const config = new Config(repo);
const settings = await config.get(modelAssetName) as ParameterData;
const loaded: boolean = settings !== null;
const model = loaded
  ? Optimize.import(settings, ranker)
  : Optimize.generate(exchange, 150, ranker);
if (loaded) console.log("Loaded settings:", settings);
else console.log("Best random starting point:", model.export());

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

// Confirm starting score
const initialScore: number = model.predict(validation);
console.log("Initial score:", initialScore);

// Run optimizer and save results
const epsilon = 0.01;
const _iterations: number = model.optimize(exchange, epochs, epsilon, status);

// Confirm final score
const finalScore: number = model.predict(validation);
console.log("Final score:", finalScore);

// Save model only if score improved
if (finalScore > initialScore) {
  const exported: ParameterData = model.export();
  console.log("Saved settings: ", exported);
  await config.set(modelAssetName, exported);
}
