/** Train ranking model */

import { avg } from "jsr:@sauber/statistics";
import { Dashboard, type Predict } from "@sauber/ml-cli-dashboard";
import type { NetworkData } from "@sauber/neurons";
import { DataFrame } from "@sauber/dataframe";

import { Backend, CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import { Community, type Investors } from "📚/repository/mod.ts";

import { Model } from "📚/ranking/model.ts";
import type { Input, Inputs, Outputs } from "📚/ranking/types.ts";
import { type Samples, TrainingData } from "📚/ranking/trainingdata.ts";

const modelAssetName = "ranking.network";

// Bind to Repo
function setupRepo(path: string): Backend {
  if (!Deno.statSync(path)) throw new Error(`${path} does not exist.`);
  const disk = new DiskBackend(path);
  const backend = new CachingBackend(disk);
  return backend;
}

// Load all investors
async function loadInvestors(repo: Backend): Promise<Investors> {
  const community = new Community(repo);
  const investors: Investors = await community.all();
  return investors;
}

// Load training data
function trainingdata(investors: Investors, window: number = 30): DataFrame {
  const td = new TrainingData(window);
  const samples: Samples = [];

  for (const investor of investors) {
    samples.push(...td.features(investor));
  }
  const records = samples.map((s) => Object.assign(s.input, s.output));
  return DataFrame.fromRecords(records);
}

// Recursively trim training data until no outliers remai0
function outlierFilter(data: DataFrame, factor: number = 10): DataFrame {
  const prev: number = data.length;
  data = data.outlier(factor);
  if (data.length != prev) {
    console.log(`Data length trimmed ${prev} to ${data.length}`);
  }
  return (data.length == prev) ? data : outlierFilter(data, factor);
}

// Load model
async function loadModel(repo: Backend, inputs: number): Promise<Model> {
  if (await repo.has(modelAssetName)) {
    console.log("Loading existing model...");
    const rankingparams = await repo.retrieve(modelAssetName) as NetworkData;
    return Model.import(rankingparams);
  } else {
    console.log("Generating new model...");
    return Model.generate(inputs);
  }
}

// Save model to repository
function saveModel(repo: Backend, model: Model): Promise<void> {
  return repo.store(modelAssetName, model.export());
}

// Identify top two input columns correlated to output
function correlations(inputs: DataFrame, outputs: DataFrame): [string, string] {
  const correlations: DataFrame = inputs
    .correlationMatrix(outputs)
    .amend("abs", (r) => Math.abs(r.SharpeRatio as number))
    .sort("abs")
    .reverse;
  const names = correlations.values<string>("Name").slice(0, 2) as [
    string,
    string,
  ];
  return names;
}

// Create dashboard
function createDashboard(
  data: DataFrame,
  predict: Predict,
  xlabel: keyof Input,
  ylabel: keyof Input,
): Dashboard {
  const epochs = 2000;
  const width = 78;
  const height = 12;
  type Point = [number, number];

  // Pick max 200 samples for overlay
  const samples: DataFrame = data.shuffle.slice(0, 200);
  const overlay: Array<Point> = samples.records.map((r) =>
    [r[xlabel], r[ylabel]] as Point
  );
  const out: number[] = samples.records.map((r) => r.SharpeRatio as number);

  return new Dashboard(
    width,
    height,
    overlay,
    out,
    predict,
    epochs,
    xlabel,
    ylabel,
  );
}

// Validation of random inputs
function validation(model: Model, data: DataFrame, count: number = 5): void {
  console.log("Validation");
  const samples = data.shuffle.slice(0, count);
  const inputs: Inputs = samples.exclude(["SharpeRatio"]).records as Inputs;
  const outputs: Outputs = samples.include(["SharpeRatio"]).records as Outputs;
  // Compare training output with predicted output
  inputs.forEach((input: Input, sample: number) => {
    console.log("sample");
    console.log("  xs:", input);
    console.log("  ys:", outputs[sample]);
    console.log("  yp:", model.predict(input));
  });
}

////////////////////////////////////////////////////////////////////////
// Main
////////////////////////////////////////////////////////////////////////

// Load investors
const repo: Backend = setupRepo(Deno.args[0]);
console.log("Loading...");
const investors: Investors = await loadInvestors(repo);

// Extract training data
console.log("Load features...");
const loaded: DataFrame = trainingdata(investors);
console.log("Loaded samples:", loaded.length);

// Filtering
const data = outlierFilter(loaded, 10);
const inputs = data.exclude(["SharpeRatio"]);
const outputs = data.include(["SharpeRatio"]);
console.log("Sanitized samples:", data.length);

// Load model
const model = await loadModel(repo, inputs.names.length);

// Get top two correlated columns
const labels = correlations(inputs, outputs) as [keyof Input, keyof Input];
console.log("Correlations:", { labels });

// Callback to model from dashboard
const colNames = inputs.names as Array<keyof Input>;
const means: Input = Object.fromEntries(
  colNames.map((
    name: keyof Input,
  ) => [name, avg(data.values(name) as number[])]),
) as Input;
function predict(a: number, b: number): number {
  means[labels[0]] = a;
  means[labels[1]] = b;
  return model.predict(means).SharpeRatio;
}

const d = createDashboard(data, predict, ...labels);

// Callback to dashboard from training
function dashboard(iteration: number, loss: number[]): void {
  console.log(d.render(iteration, loss[loss.length - 1]));
}

// Training
console.log("Training...");
const iterations = 2000;
const learning_rate = 0.001;
const batch_size = 64;
const results = model.train(
  inputs.records as Inputs,
  outputs.records as Outputs,
  iterations,
  learning_rate,
  batch_size,
  dashboard,
);
console.log(d.finish());
console.log(results);
validation(model, data, 5);

// Store Model
console.log("Saving...");
await saveModel(repo, model);
