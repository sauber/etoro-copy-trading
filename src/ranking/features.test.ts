import {
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import { Tick } from "📚/tick/mod.ts";
import { community } from "./testdata.ts";
import { Features } from "./features.ts";
import type { Input, Output } from "./types.ts";

const investor = await community.investor("Robier89");

Deno.test("Initialization", () => {
  const rank = new Features(investor);
  assertInstanceOf(rank, Features);
});

Deno.test("Input at oldest date", () => {
  const rank = new Features(investor);
  const tick: Tick = investor.stats.start;
  const features: Input = rank.input(tick);
  assertEquals(features.Gain, 50.53);
});

Deno.test("Input at most recent date", () => {
  const rank = new Features(investor);
  const tick: Tick = investor.stats.end;
  const features: Input = rank.input(tick);
  assertEquals(features.Gain, 31.86);
});

Deno.test("Output", () => {
  const rank = new Features(investor);
  const tick: Tick = investor.stats.start;
  const output: Output = rank.output(tick);
  assertAlmostEquals(output, 2.04, 0.01);
});
