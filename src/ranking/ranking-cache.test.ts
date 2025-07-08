import { assertInstanceOf, assertNotEquals } from "@std/assert";
import { Bar } from "@sauber/backtest";
import { InvestorRanking } from "./investor-ranking.ts";
import { HeapBackend } from "📚/storage/mod.ts";
import { RankingCache } from "📚/ranking/ranking-cache.ts";
import { investor } from "📚/ranking/testdata.ts";

const repo = new HeapBackend();
const rank = new InvestorRanking(repo).generate();


Deno.test("Instance", ()=>{
  const cache = new RankingCache(rank);
  assertInstanceOf(cache, RankingCache);
});

Deno.test("Predict at dates", () => {
  const bar: Bar = investor.end;
  const cache = new RankingCache(rank);
  const out1 = cache.predict(investor, bar-10);
  const out2 = cache.predict(investor, investor.start+10);
  assertNotEquals(out1, 0);
  assertNotEquals(out2, 0);
});
