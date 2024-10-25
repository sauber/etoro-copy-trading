/** Train ranking model */

import { avg, correlation, std } from "jsr:@sauber/statistics";
import { Dashboard, type Predict } from "jsr:@sauber/ml-cli-dashboard";
import type { NetworkData } from "@sauber/neurons";
import { shuffleArray } from "@hugoalh/shuffle-array";

import { Backend, CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import { Community } from "📚/repository/community.ts";

import { Model } from "📚/ranking/model.ts";
import { input_labels } from "📚/ranking/mod.ts";
import type { Input, Inputs, Output, Outputs } from "📚/ranking/mod.ts";
import { TrainingData } from "📚/ranking/trainingdata.ts";

// Type for column of data
type Col = Array<number>;
type Row = Array<number>;

// Input and Output training data
type Dataset = { inputs: Inputs; outputs: Outputs };

const modelAsset = "ranking.network";

// Load training data
async function loadTrainingdata(repo: Backend): Promise<Dataset> {
  const community = new Community(repo);
  const data = new TrainingData(community, 30);
  await data.load();
  const xs: Inputs = data.inputs;
  const ys: Outputs = data.outputs;
  return { inputs: xs, outputs: ys };
}

// Transpose rows to columns
function transpose(rows: Array<Row>): Array<Col> {
  return rows[0].map((_: number, i: number) => rows.map((r: Row) => r[i]));
}

// Indices of outliers
function outlierIndex(rows: Array<Row>, factor: number = 10): Array<number> {
  const index: Array<number> = [];

  // Mean and standard deviation for each column
  const columns = transpose(rows);
  const means: Row = columns.map((c: Col) => avg(c));
  const stds: Row = columns.map((c: Col) => std(c));

  // Record indices of rows having an outlier
  rows.forEach((row: Row, rownum: number) => {
    row.every((v: number, colnum: number) => {
      const mean = means[colnum];
      const std = stds[colnum];
      const outlie = Math.abs(mean - v) / std;
      if (outlie < factor) return true;

      // console.log("skip", { v, mean, std, outlie, rownum, colnum });
      index.push(rownum);
      return false;
    });
  });

  return index;
}

// Return only each number once
function uniq(list: Row): Row {
  return list.filter((x, i, a) => a.indexOf(x) == i);
}

// Remove outliers from data
function outlierFilter(data: Dataset): Dataset {
  // Identifify indices outliers in input and output data
  const skipx: Col = outlierIndex(data.inputs);
  const skipy: Col = outlierIndex(data.outputs);
  const skip: Col = uniq([...skipx, ...skipy]);

  // No outliers found
  if (skip.length == 0) return data;

  // Filter as long as outliers are found
  console.log(`Removed ${skip.length} outliers`);

  return outlierFilter({
    inputs: data.inputs.filter((_, i: number) => !skip.includes(i)),
    outputs: data.outputs.filter((_, i: number) => !skip.includes(i)),
  });
}

// Load model
async function loadModel(repo: Backend, inputs: number): Promise<Model> {
  if (await repo.has(modelAsset)) {
    console.log("Loading existing model...");
    const rankingparams = await repo.retrieve(modelAsset) as NetworkData;
    return Model.import(rankingparams);
  } else {
    console.log("Generating new model...");
    return Model.generate(inputs);
  }
}

// Save model to repository
function saveModel(model: Model): Promise<void> {
  return backend.store(modelAsset, model.export());
}

// Identify top two input columns correlated to output
function correlations(data: Dataset): [number, number] {
  // Correlate all inputs columns to output column
  const columns = transpose(data.inputs);
  const out: Col = data.outputs.map((r: Output) => r[0]);
  const cor: Col = columns.map((c) => correlation(c, out));

  // Sort columns by highest correlation
  type CS = [number, number];
  const sorted_index: Col = cor
    .map((c: number, i: number) => [i, Math.abs(c)] as CS)
    .sort((a: CS, b: CS) => b[1] - a[1])
    .map((x: CS) => x[0]);

  // Return indices of the two highest correlation columns
  return [0, 1].map((i) => sorted_index[i]) as [number, number];
}

// Create dashboard
function createDashboard(
  data: Dataset,
  predict: Predict,
  columns: [number, number],
  labels: [string, string],
): Dashboard {
  const epochs = 2000;
  const width = 78;
  const height = 12;
  type Point = [number, number];
  const [xi, yi] = columns;
  const overlay: Array<Point> = shuffleArray(
    data.inputs.map((r: Input) => [r[xi], r[yi]] as Point),
  ).slice(0, 200);
  const out = data.outputs.map((r: Row) => r[0]);
  return new Dashboard(
    width,
    height,
    overlay,
    out,
    predict,
    epochs,
    labels[0],
    labels[1],
  );
}

// Validation of random inputs
function validation(model: Model, data: Dataset, count: number = 5): void {
  console.log("Validation");
  const samples = shuffleArray(Array.from(Array(data.inputs.length).keys()))
    .slice(0, count)
    .sort((a: number, b: number) => a - b);
  // Compare training output with predicted output
  samples.forEach((sample: number) => {
    const input: Input = data.inputs[sample];
    console.log("sample n:", sample);
    console.log("  xs:", input);
    console.log("  ys:", data.outputs[sample]);
    console.log("  yp:", model.predict(input));
  });
}

////////////////////////////////////////////////////////////////////////
// Main
////////////////////////////////////////////////////////////////////////

// Repo
if (!Deno.args[0]) throw new Error("Path missing");
const path: string = Deno.args[0];
const disk = new DiskBackend(path);
const backend = new CachingBackend(disk);

// Load training data
console.log("Loading...");
const loaded: Dataset = await loadTrainingdata(backend);
console.log("Loaded samples:", loaded.inputs.length);

// Filtering
const data = outlierFilter(loaded);
console.log("Sanitized samples:", data.inputs.length);

// Load model
const model = await loadModel(backend, data.inputs[0].length);

// Get top two correlated columns
const cor = correlations(data) as [number, number];
// const [xi, yi] = cor;
const labels = cor.map((i) => input_labels[i]) as [string, string];
console.log("Correlations:", { cor, labels });

// Callback to model from dashboard
const means: Input = transpose(data.inputs).map((c: Col) => avg(c)) as Input;
function predict(a: number, b: number): number {
  means[cor[0]] = a;
  means[cor[1]] = b;
  return model.predict(means)[0];
}

const d = createDashboard(data, predict, cor, labels);

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
  data.inputs,
  data.outputs,
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
await saveModel(model);
