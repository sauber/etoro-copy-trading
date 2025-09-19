import type { StatsResults } from "@sauber/etoro-investors";
import { assertEquals } from "@std/assert";
import { Stats } from "./stats.ts";
import { testAssets } from "./testdata.ts";

const statsData: StatsResults = testAssets.stats;

Deno.test("Validate", () => {
  const stats: Stats = new Stats(statsData);
  assertEquals(stats.validate(), true);
});
