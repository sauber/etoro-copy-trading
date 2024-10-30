import { assertEquals } from "@std/assert";
import { Stats } from "./stats.ts";
import { testAssets } from "./testdata.ts";
import type { StatsData } from "./stats.ts";

const statsData: StatsData = testAssets.stats;

Deno.test("Validate", () => {
  const stats: Stats = new Stats(statsData);
  assertEquals(stats.validate(), true);
});
