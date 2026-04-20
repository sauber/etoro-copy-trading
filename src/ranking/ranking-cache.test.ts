import { assertInstanceOf, assertNotEquals } from "@std/assert";
import { InvestorRanking } from "./investor-ranking.ts";
import { HeapBackend } from "@sauber/journal";
import { RankingCache } from "📚/ranking/ranking-cache.ts";
import { investor } from "📚/ranking/testdata.ts";
import { Tick } from "📚/tick/mod.ts";

const repo = new HeapBackend();
// const ticker = new Timeline(chartStart);
const rank = new InvestorRanking(repo, 15).generate();

Deno.test("Instance", () => {
  const cache = new RankingCache(rank);
  assertInstanceOf(cache, RankingCache);
});

Deno.test("Predict at dates", () => {
  const tick: Tick = investor.end;
  const cache = new RankingCache(rank);
  const out1 = cache.predict(investor, tick - 10);
  const out2 = cache.predict(investor, investor.start + 10);
  assertNotEquals(out1, 0);
  assertNotEquals(out2, 0);
});
