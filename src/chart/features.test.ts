import { Bar, createTestInstrument, Instrument } from "@sauber/backtest";
import { Features } from "./features.ts";
import {
  assertEquals,
  assertGreater,
  assertInstanceOf,
  assertLess,
} from "@std/assert";

Deno.test("Instance", () => {
  const instr: Instrument = createTestInstrument(100);
  const features = new Features(instr, 0, 0, 0, 0);
  assertInstanceOf(features, Features);
});

Deno.test("Input", () => {
  // Create situation
  const instr: Instrument = createTestInstrument(100);
  const end: Bar = instr.end;
  const gap = 5;
  const bars = 10;
  const features = new Features(instr, bars, gap, 0, end);

  // Generate input data
  const input = features.input;

  // Reconstruct last expected input data point
  const index = instr.series.length - 1 - gap;
  const [prev, value] = instr.series.slice(index - 1, index + 1);
  const expected = (value - prev) / prev;

  // Confirm generated value match expected
  const actual = input[input.length - 1];
  assertEquals(actual, expected);
});

Deno.test("Output", () => {
  // Create situation
  const instr: Instrument = createTestInstrument(200);
  const gap = 5;
  const bars = 10;
  const end: Bar = instr.end + bars;
  const features = new Features(instr, 0, gap, bars, end);

  // Generate output data
  const output: number = features.output[0];
  assertGreater(output, -1);
  assertLess(output, 1);
  // console.log({ output });
});
