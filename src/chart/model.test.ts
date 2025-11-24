import { Network } from "@sauber/neurons";
import { Model } from "./model.ts";
import { assert, assertEquals, assertInstanceOf } from "@std/assert";
import { investors, temprepo } from "./testdata.ts";
import { Instrument, Series } from "@sauber/backtest";
import { linechart } from "@sauber/widgets";

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
});
