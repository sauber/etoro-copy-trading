import { assertEquals } from "@std/assert";
import { Stats } from "./stats.ts";
import { testAssets } from "./testdata.ts";
import type { StatsResults } from "@sauber/etoro-investors";

const statsData: StatsResults = testAssets.stats;

Deno.test("Validate", () => {
  const stats: Stats = new Stats(statsData);
  assertEquals(stats.validate(), true);
});
