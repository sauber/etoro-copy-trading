import { assertInstanceOf, assertNotEquals } from "@std/assert";
import { HeapBackend } from "@sauber/journal";
import { InvestorRanking } from "./investor-ranking.ts";
import { investor } from "📚/ranking/testdata.ts";
import { Tick } from "@sauber/backtest";
// import { Timeline } from "📚/tick/mod.ts";

const repo = new HeapBackend();
// const ticker = new Timeline(chartStart);

Deno.test("Initialize", () => {
  const rank = new InvestorRanking(repo);
  assertInstanceOf(rank, InvestorRanking);
});

Deno.test("Predict at date", () => {
  const rank = new InvestorRanking(repo).generate();
  const end: Tick = investor.end;
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
