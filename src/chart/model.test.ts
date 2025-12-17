import { Network } from "@sauber/neurons";
import { Model } from "./model.ts";
import { assert, assertEquals, assertInstanceOf } from "@std/assert";
import { investors, temprepo } from "./testdata.ts";
import { Instrument, Series } from "@sauber/backtest";
import { Frame, LineChart, linechart, Progress, Stack } from "@sauber/widgets";

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
  const model_length = Model.input_bars + Model.gap_bars;
  const series: Series = new Float32Array(
    Array(model_length + 1).keys().map((_) => Math.random() - 0.5),
  );
  const instr: Instrument = new Instrument(series, 0);
  const output: number = model.predict(instr, 0);
  assert(isFinite(output));
});

Deno.test("Training", () => {
  // Create a dashboard
  const epochs = 100;
  const chart = new LineChart([], 11);
  const eta = new Progress("Epoch", 100, 72);
  const dashboard = new Frame(new Stack([chart, eta]), "Network Loss");
  console.log(dashboard.toString());

  // Callback for updating dashboard while training
  const update = (iteration: number, loss: number[]) => {
    chart.update(loss);
    eta.update(iteration);
    const cursorUp = `\u001b[${dashboard.height}A`; // Move cursor up
    console.log(cursorUp + dashboard.toString());
  };

  const model = Model.generate();
  const losses: number[] = model.train(investors, epochs, 132, update);
  console.log(
    "Loss improvements from",
    Number(losses[0].toPrecision(3)),
    "to",
    Number(losses[losses.length - 1].toPrecision(3)),
  );
  assert(isFinite(losses[losses.length - 1]));
});

Deno.test("Validation", () => {
  const epochs = 10;
  const batchsize = 32;
  const model = Model.generate();
  console.log("Training...");
  const _losses: number[] = model.train(investors, epochs, batchsize);
  console.log("Validating...");
  model.validation(investors, 300);
});
