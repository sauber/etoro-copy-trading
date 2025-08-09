import { assertInstanceOf } from "@std/assert";
import { Config } from "📚/config/config.ts";
import { Community, TestCommunity } from "📚/repository/mod.ts";
import { Assets } from "./assets.ts";
import { path } from "./testdata.ts";
import { InvestorRanking } from "📚/ranking/mod.ts";
import { Timing } from "📚/timing/mod.ts";

Deno.test("Heap Backend", () => {
  const assets = Assets.heap();
  assertInstanceOf(assets, Assets);
});

Deno.test("Disk Backend", () => {
  const assets = Assets.disk(path);
  assertInstanceOf(assets, Assets);
});

Deno.test("Config", () => {
  const assets = Assets.heap();
  assertInstanceOf(assets.config, Config);
});

Deno.test("Community", () => {
  const assets = Assets.heap();
  assertInstanceOf(assets.community, Community);
});

Deno.test("Test Community", () => {
  const assets = Assets.heap();
  assertInstanceOf(assets.testcommunity, TestCommunity);
});

Deno.test("Ranking", () => {
  const assets = Assets.heap();
  assertInstanceOf(assets.ranking, InvestorRanking);
});
