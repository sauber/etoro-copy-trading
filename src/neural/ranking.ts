import { Backend } from "📚/backend/mod.ts";
import { Community, Investors } from "📚/repository/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { diffDate } from "📚/time/mod.ts";
import { Features } from "📚/ranking/mod.ts";
import { DataFrame } from "@dataframe";
import { avg } from "📚/math/statistics.ts";
import { Dense, LRelu, Network, Normalization, Relu } from "./micrograd.ts";
import { Train } from "./train.ts";

// Load investor data
const backend = new Backend(Deno.args[0]);
const community: Community = backend.community;
const all: Investors = await community.all();
const investors: Investors = all.filter(
  (investor: Investor) =>
    diffDate(investor.stats.start, investor.chart.end) >= 30 &&
    investor.chart.last != 6000,
);
console.log("Total loaded: ", all.length, "Trainable: ", investors.length);

// Identify input and output features
type Sample = {
  input: Record<string, number>;
  output: Record<string, number>;
};
type Training = Array<Sample>;
const features: Training = investors.map((investor: Investor) => {
  const f = new Features(investor);
  return { input: f.input(), output: f.output() };
});

// Use Correlation matrix to extract only the top 5 inputs most correlated to output
const input = DataFrame.fromRecords(features.map((f) => f.input));
const output = DataFrame.fromRecords(features.map((f) => f.output)).include([
  "SharpeRatio",
]);
const corr = input.correlationMatrix(output);
const columns = 5;
const weights = corr
  .amend("Abs", (r) => Math.abs(r.SharpeRatio as number))
  .sort("Abs")
  .reverse
  .slice(0, columns)
  .include(["Keys", "SharpeRatio"])
  .rename({ Keys: "Key", SharpeRatio: "Weight" })
  .bake;
const w: Record<string, number> = Object.assign(
  {},
  ...weights.records.map((r) => ({ [r.Key as string]: r.Weight })),
);
console.log("Correlations:", w);
const keys = weights.column("Key").values as string[];
const inputs = input.include(keys);

// Transform to training data
const xs: number[][] = inputs.records.map((r) => Object.values(r) as number[]);
const ys: number[][] = output.records.map((r) => [r.SharpeRatio as number]);

const network = new Network([
  new Normalization(5),
  new Dense(5, 11),
  new LRelu(),
  new Dense(11, 5),
  new LRelu(),
  new Dense(5, 1),
]);
const train = new Train(network, xs, ys);
train.epsilon = 0.0001;
train.run(200, 0.2);
console.log(train.loss_chart());
// network.print();

// Scatter plot
const xmin: number = Math.min(...xs.map((r) => r[0]));
const xmax: number = Math.max(...xs.map((r) => r[0]));
const ymin: number = Math.min(...xs.map((r) => r[1]));
const ymax: number = Math.max(...xs.map((r) => r[1]));
const pad: [number, number, number] = [
  avg(xs.map((r) => r[2])),
  avg(xs.map((r) => r[3])),
  avg(xs.map((r) => r[4])),
];

await train.scatter_chart([xmin, xmax], [ymin, ymax], pad, 23);

// Validation
// xs.forEach((input, index) => console.log(input, ys[index], network.predict(input)));
// const ypred = xs.map((x) => network.predict(x)); // run the model on each input and get an array of predictions
// console.log('ys [actual, prediction]:', ypred.map((y, index) => [ys[index].data, y.data as Value]));
// console.log(ys.map((y) => y.data));

// Display predictions for 5 random samples
console.log("Validation");
for (let i = 0; i < 5; i++) { // train the model for 200 iterations
  const sample = Math.floor(Math.random() * xs.length);
  console.log("sample n:", sample);
  console.log("  xs:", xs[sample]);
  console.log("  ys:", ys[sample]);
  console.log("  yp:", network.predict(xs[sample]));
}
