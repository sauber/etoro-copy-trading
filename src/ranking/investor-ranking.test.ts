import { assertInstanceOf, assertNotEquals } from "@std/assert";
import { HeapBackend } from "@sauber/journal";

import { investor } from "📚/ranking/testdata.ts";
import { Tick } from "📚/tick/mod.ts";

import { InvestorRanking } from "./investor-ranking.ts";

const repo = new HeapBackend();
const ticks_required = 15;

Deno.test("Initialize", () => {
  const rank = new InvestorRanking(repo, ticks_required);
  assertInstanceOf(rank, InvestorRanking);
});

Deno.test("Predict at date", () => {
  const rank = new InvestorRanking(repo, ticks_required).generate();
  const end: Tick = investor.end;
  const out = rank.predict(investor, end);
  assertNotEquals(out, 0);
});

Deno.test("Loading", async () => {
  const rank = new InvestorRanking(repo, ticks_required).generate();
  await rank.load();
  assertInstanceOf(rank, InvestorRanking);
});

Deno.test("Saving", async () => {
  const rank = new InvestorRanking(repo, ticks_required).generate();
  await rank.save();
  assertInstanceOf(rank, InvestorRanking);
});
