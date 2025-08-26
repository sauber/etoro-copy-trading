import { loadRanker } from "../ranking/ranker.ts";
import {
  buildStrategy,
  Rater,
  saveSettings,
  StrategyParameters,
} from "./strategy.ts";
import { Strategy } from "@sauber/backtest";
import { assertInstanceOf, assertThrows } from "@std/assert";
import { loadStrategy } from "./mod.ts";
import { HeapBackend } from "@sauber/journal";
import { Signal } from "../signal/mod.ts";

const repo = new HeapBackend();
const ranker: Rater = await loadRanker(repo);
const timer: Rater = await loadRanker(repo);

Deno.test("Build Strategy", () => {
  const p: StrategyParameters = {
    position_size: 0.01,
    stoploss: 0.85,
    limit: 1,
    weekday: 1,
  };
  const strategy: Strategy = buildStrategy(p, ranker, timer);
  assertInstanceOf(strategy, Object);
});

Deno.test("Parameter out of range", () => {
  const p = {
    position_size: 1,
    stoploss: 0.85,
    limit: 1,
    weekday: 0,
  };
  assertThrows(() => buildStrategy(p, ranker, timer));
});

Deno.test("Save parameters", async () => {
  const p = {
    position_size: 0.01,
    stoploss: 0.85,
    limit: 1,
    weekday: 1,
  };
  await saveSettings(repo, p);
});

Deno.test("Load Strategy", async () => {
  // Save some timer settings first
  await Signal.default().save(repo);

  const strategy: Strategy = await loadStrategy(repo);
  assertInstanceOf(strategy, Object);
});
