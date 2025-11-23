import { Network } from "@sauber/neurons";
import { Model } from "./model.ts";
import { assert, assertEquals, assertInstanceOf } from "@std/assert";
import { temprepo } from "./testdata.ts";
import { Instrument, Series } from "@sauber/backtest";

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
    Array(16).keys().map((_) => Math.random() - 0.5),
  );
  const instr: Instrument = new Instrument(series, 0);
  const output: number = model.predict(instr, 0);
  assert(isFinite(output));
});
