import { assertInstanceOf, assertNotEquals } from "@std/assert";
import { HeapBackend } from "📚/storage/mod.ts";
import { InvestorRanking } from "./investor-ranking.ts";
import { investor } from "📚/ranking/testdata.ts";
import { Bar } from "@sauber/backtest";

const repo = new HeapBackend();

Deno.test("Initialize", () => {
  const rank = new InvestorRanking(repo);
  assertInstanceOf(rank, InvestorRanking);
});

Deno.test("Predict at date", () => {
  const rank = new InvestorRanking(repo).generate();
  const end: Bar = investor.chart.end;
  const out = rank.predict(investor, end);
  assertNotEquals(out, 0);
});

Deno.test("Loading", async () => {
  const rank = new InvestorRanking(repo);
  await rank.load();
  assertInstanceOf(rank, InvestorRanking);
});

Deno.test("Saving", async () => {
  const rank = new InvestorRanking(repo).generate();
  await rank.save();
  assertInstanceOf(rank, InvestorRanking);
});
