import { assertInstanceOf, assertNotEquals } from "@std/assert";
import { InvestorRanking } from "./investor-ranking.ts";
import { HeapBackend } from "@sauber/journal";
import { RankingCache } from "📚/ranking/ranking-cache.ts";
import { chartStart, investor } from "📚/ranking/testdata.ts";
import { Timeline } from "📚/tick/mod.ts";
import { Tick } from "@sauber/backtest";

const repo = new HeapBackend();
const ticker = new Timeline(chartStart);
const rank = new InvestorRanking(repo, ticker).generate();

Deno.test("Instance", () => {
  const cache = new RankingCache(rank, chartStart);
  assertInstanceOf(cache, RankingCache);
});

Deno.test("Predict at dates", () => {
  const tick: Tick = investor.end;
  const cache = new RankingCache(rank, chartStart);
  const out1 = cache.predict(investor, tick - 10);
  const out2 = cache.predict(investor, investor.start + 10);
  assertNotEquals(out1, 0);
  assertNotEquals(out2, 0);
});
