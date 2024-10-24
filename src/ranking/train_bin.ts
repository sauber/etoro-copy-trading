/** Train ranking model */

import { avg, correlation } from "jsr:@sauber/statistics";
import { Dashboard } from "jsr:@sauber/ml-cli-dashboard";
import type { NetworkData } from "@sauber/neurons";
import { shuffleArray } from "@hugoalh/shuffle-array";
import { CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import { Model } from "📚/ranking/model.ts";
import {
  type Input,
  input_labels,
  type Inputs,
  type Outputs,
} from "📚/ranking/mod.ts";
import { TrainingData } from "📚/ranking/trainingdata.ts";
import { Community } from "📚/repository/community.ts";

type Row = Array<number>;
type Col = Array<number>;

// Repo
if (!Deno.args[0]) throw new Error("Path missing");
const path: string = Deno.args[0];
const disk = new DiskBackend(path);
const backend = new CachingBackend(disk);

// Training data
console.log("Loading...");
const community = new Community(backend);
const data = new TrainingData(community, 30);
await data.load();
const xs: Inputs = data.inputs;
const ys: Outputs = data.outputs;
console.log("Data Length:", xs.length);

// Model
const assetname = "ranking.network";
let model: Model;
if (await backend.has(assetname)) {
  console.log("Loading existing model...");
  const rankingparams = await backend.retrieve(assetname) as NetworkData;
  model = Model.import(rankingparams);
} else {
  console.log("Generating new model...");
  model = Model.generate(xs[0].length);
}

// Find the two most correlated columns
const columns: Array<Col> = xs[0].map((_: Row, i: number) =>
  xs.map((r: Row) => r[i])
);
const out: Col = ys.map((r: Row) => r[0]);
const correlations: Col = columns.map((c) => correlation(c, out));
type CS = [number, number];
const sorted_index: Col = correlations
  .map((c: number, i: number) => [i, Math.abs(c)] as CS)
  .sort((a: CS, b: CS) => b[1] - a[1])
  .map((x: CS) => x[0]);
[0, 1].forEach((s: number) => {
  const index: number = sorted_index[s];
  const label: string = input_labels[index];
  console.log("Correlation for label", index, label, "is", correlations[index]);
});

// Callback to model from dashboard
const means: Input = columns.map((c: Col) => avg(c)) as Input;
const xi = sorted_index[0];
const yi = sorted_index[1];
function predict(a: number, b: number): number {
  means[xi] = a;
  means[yi] = b;
  return model.predict(means)[0];
}

// Dashboard
const epochs = 2000;
const width = 78;
const height = 12;
const xlabel: string = input_labels[sorted_index[0]];
const ylabel: string = input_labels[sorted_index[1]];
type Point = [number, number];
const overlay: Array<Point> = shuffleArray(
  xs.map((r: Row) => [r[xi], r[yi]] as Point),
).slice(0, 100);
const d = new Dashboard(
  width,
  height,
  overlay,
  out,
  predict,
  epochs,
  xlabel,
  ylabel,
);

// Callback to dashboard from training
function dashboard(iteration: number, loss: number[]): void {
  console.log(d.render(iteration, loss[loss.length - 1]));
}

// Training
console.log("Training...");
const iterations = 2000;
const learning_rate = 0.001;
const results = model.train(xs, ys, iterations, learning_rate, dashboard);
console.log(results);

// Validation of 5 random inputs
console.log("Validation");
const samples = shuffleArray(Array.from(Array(xs.length).keys()))
  .slice(0, 5)
  .sort((a: number, b: number) => a - b);
// Compare training output with predicted output
samples.forEach((sample: Row) => {
  console.log("sample n:", sample);
  console.log("  xs:", xs[sample]);
  console.log("  ys:", ys[sample]);
  console.log("  yp:", model.predict(xs[sample]));
});

// Store Model
console.log("Saving...");
await backend.store(assetname, model.export());
