import { Network } from "@sauber/neurons";
import { Model } from "./model.ts";
import { assert, assertEquals, assertInstanceOf } from "@std/assert";
import { investors, temprepo } from "./testdata.ts";
import { Instrument, Series } from "@sauber/backtest";
import { linechart } from "@sauber/widgets";
import { Features, Sample, Samples } from "./features.ts";
import { Investor } from "../investor/mod.ts";

Deno.test("Instance", () => {
  const network = new Network(1);
  const model = new Model(network);
  assertInstanceOf(model, Model);
});

Deno.test("Generate", () => {
  const model = Model.generate();
  assertInstanceOf(model, Model);
});

Deno.test("Missing asset", async () => {
  const model = await Model.load(temprepo);
  assertEquals(model, false);
});

Deno.test("Save/load", async () => {
  // Save
  const model = Model.generate();
  await model.save(temprepo);

  // Load
  const loaded = await Model.load(temprepo);
  assertInstanceOf(loaded, Model);
});

Deno.test("Predict", () => {
  const model = Model.generate();
  const series: Series = new Float32Array(
    Array(17).keys().map((_) => Math.random() - 0.5),
  );
  const instr: Instrument = new Instrument(series, 0);
  const output: number = model.predict(instr, 0);
  assert(isFinite(output));
});

Deno.test("Train", () => {
  const model = Model.generate();
  const losses: number[] = model.train(investors, 10000, 32);
  console.log("Loss:", losses[0], "...", losses[losses.length - 1]);
  // assert(isFinite(loss));
  console.log(linechart(losses, 15, 78));

  // Validation
  const features = new Features(investors, 14, 100, 2);
  const samples: Samples = features.samples(5);
  const xs = samples.map((s: Sample) => Array.from(s[0]));
  const ys = samples.map((s: Sample) => s[1]);
  samples.forEach((s: Sample, i: number) => {
    const series: Series = new Float32Array(xs[i]);
    const prediction: number = model.predict(new Instrument(series, 0), 0);
    const actual: number = ys[i];
    const error: number = Math.abs(prediction - actual);
    console.log({
      series,
      prediction,
      actual,
      error,
    });
  });
});
