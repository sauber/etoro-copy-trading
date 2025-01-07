import {
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import { community } from "📚/ranking/testdata.ts";
import { Features } from "📚/ranking/features.ts";
import type { Input, Output } from "📚/ranking/types.ts";
import { DateFormat, dateToBar } from "📚/time/mod.ts";
import { Bar } from "@sauber/backtest";

const investor = await community.investor("Robier89");

Deno.test("Initialization", () => {
  const rank = new Features(investor);
  assertInstanceOf(rank, Features);
});

Deno.test("Input at oldest date", () => {
  const rank = new Features(investor);
  const date: DateFormat = investor.stats.start;
  const bar: Bar = dateToBar(date);
  const features: Input = rank.input(bar);
  assertEquals(features.Gain, 50.53);
});

Deno.test("Input at most recent date", () => {
  const rank = new Features(investor);
  const date: DateFormat = investor.stats.end;
  const bar: Bar = dateToBar(date);
  const features: Input = rank.input(bar);
  assertEquals(features.Gain, 31.86);
});

Deno.test("Output", () => {
  const rank = new Features(investor);
  const date: DateFormat = investor.stats.start;
  const bar: Bar = dateToBar(date);
  const features: Output = rank.output(bar);
  assertAlmostEquals(features.SharpeRatio, 2.19, 0.01);
});
