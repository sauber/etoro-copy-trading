import { assertInstanceOf } from "@std/assert/instance-of";
import { Config } from "📚/config/config.ts";
import { Community } from "📚/repository/mod.ts";
import { Assets } from "📚/backend/assets.ts";
import { path } from "📚/backend/testdata.ts";
import { Asset } from "📚/storage/mod.ts";

Deno.test("Heap Backend", () => {
  const assets = Assets.heap();
  assertInstanceOf(assets, Assets);
  assertInstanceOf(assets.config, Config);
  assertInstanceOf(assets.community, Community);
  assertInstanceOf(assets.ranking, Asset);
});

Deno.test("Disk Backend", () => {
  const assets = Assets.disk(path);
  assertInstanceOf(assets, Assets);
});
