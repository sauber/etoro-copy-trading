// import type { NetworkData } from "@sauber/neurons";
import {
  assertEquals,
  assertGreater,
  assertInstanceOf,
  assertLessOrEqual,
  assertNotEquals,
} from "@std/assert";
import { Model, TimingData } from "📚/timing/model.ts";
// import type { Input, Inputs, Output, Outputs } from "./types.ts";
// import { input_labels } from "📚/timing/types.ts";

/** Generate a random set of input */
// function input(): Input {
//   return Object.fromEntries(
//     input_labels.map((label) => [label, Math.random()]),
//   ) as Input;
// }

/** Generate a random set of output */
// function output(): Output {
//   return { SharpeRatio: Math.random() };
// }

/** Number of input features */
// const features = input_labels.length;

Deno.test("Generate", () => {
  assertInstanceOf(Model.generate(), Model);
});

Deno.test("Export / Import", () => {
  const m = Model.generate();
  const e: TimingData = m.export();
  assertEquals(e.length, 4);
  const i = Model.import(e);
  assertInstanceOf(i, Model);
});

// Deno.test("Train", () => {
//   const m = Model.generate(features);
//   const inputs: Inputs = [input(), input(), input(), input()];
//   const outputs: Outputs = [output(), output(), output(), output()];
//   const max = 2000;
//   const results = m.train(inputs, outputs, max);
//   assertGreater(results.iterations, 0);
//   assertLessOrEqual(results.iterations, max);
// });

// Deno.test("Predict", () => {
//   const m = Model.generate(features);
//   const inp: Input = input();
//   const out: Output = m.predict(inp);
//   assertNotEquals(out.SharpeRatio, 0);
// });
