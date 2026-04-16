import {
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import { community } from "📚/ranking/testdata.ts";
import { Features } from "📚/ranking/features.ts";
import type { Input, Output } from "📚/ranking/types.ts";
// import { DateFormat, Timeline } from "📚/tick/mod.ts";
import { Tick } from "@sauber/backtest";

const investor = await community.investor("Robier89");
// const ticker = new Timeline(chartStart);

Deno.test("Initialization", () => {
  const rank = new Features(investor);
  assertInstanceOf(rank, Features);
});

Deno.test("Input at oldest date", () => {
  const rank = new Features(investor);
  const tick: Tick = investor.stats.start;
  // const tick: Tick = ticker.tick(date);
  const features: Input = rank.input(tick);
  assertEquals(features.Gain, 50.53);
});

Deno.test("Input at most recent date", () => {
  const rank = new Features(investor);
  const tick: Tick = investor.stats.end;
  // const tick: Tick = ticker.tick(date);
  const features: Input = rank.input(tick);
  assertEquals(features.Gain, 31.86);
});

Deno.test("Output", () => {
  const rank = new Features(investor);
  const tick: Tick = investor.stats.start;
  // const tick: Tick = ticker.tick(date);
  const output: Output = rank.output(tick);
  assertAlmostEquals(output, 2.04, 0.01);
});
