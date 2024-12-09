import { assertEquals } from "@std/assert";
import { Chart } from "📚/chart/mod.ts";
import { today } from "📚/time/mod.ts";
import { CrossPath } from "📚/indicator/cross-path.ts";

Deno.test("Cross Path Strategy", () => {
  const testData = [40, 42, 44, 40, 38, 42, 45, 48, 50];
  const chart = new Chart(testData, today());
  const strategy = new CrossPath(chart, 2, 4);
  assertEquals(strategy.values, [-0.5, 0, 1, 0, 0]);
});
