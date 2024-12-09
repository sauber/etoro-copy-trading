import { assertInstanceOf } from "@std/assert/instance-of";
import { Config } from "📚/config/config.ts";
import { Community } from "📚/repository/mod.ts";
import { Assets } from "📚/backend/assets.ts";
import { path } from "📚/backend/testdata.ts";
import { Ranking } from "📚/ranking/mod.ts";

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

Deno.test("Ranking", async () => {
  const assets = Assets.heap();
  assertInstanceOf((await assets.ranking()), Ranking);
});
