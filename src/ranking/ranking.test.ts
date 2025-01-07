import { assertInstanceOf, assertNotEquals } from "@std/assert";
import { HeapBackend } from "📚/storage/mod.ts";
import { Ranking } from "📚/ranking/ranking.ts";
import { investor } from "📚/ranking/testdata.ts";
import { Bar } from "@sauber/backtest";

const repo = new HeapBackend();

Deno.test("Initialize", () => {
  const rank = new Ranking(repo);
  assertInstanceOf(rank, Ranking);
});

Deno.test("Predict at date", () => {
  const rank = new Ranking(repo).generate();
  const end: Bar = investor.chart.end;
  const out = rank.predict(investor, end);
  assertNotEquals(out, 0);
});

Deno.test("Loading", async () => {
  const rank = new Ranking(repo);
  await rank.load();
  assertInstanceOf(rank, Ranking);
});

Deno.test("Saving", async () => {
  const rank = new Ranking(repo).generate();
  await rank.save();
  assertInstanceOf(rank, Ranking);
});
