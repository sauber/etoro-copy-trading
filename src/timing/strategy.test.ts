import { community } from "📚/timing/testdata.ts";
import { Noop, Random } from "📚/timing/strategy.ts";
import { assertEquals, assertInstanceOf, assertNotEquals } from "@std/assert";

const investor = await community.any();
const chart = investor.chart;

Deno.test("Do nothing strategy", () => {
  const strategy = new Noop(chart);
  assertInstanceOf(strategy, Noop);
  assertEquals(strategy.start, chart.start);
  assertEquals(strategy.end, chart.end);
  assertEquals(strategy.signal(strategy.start), 0);
});

Deno.test("Random strategy", () => {
  const strategy = new Random(chart);
  assertInstanceOf(strategy, Random);
  assertEquals(strategy.start, chart.start);
  assertEquals(strategy.end, chart.end);
  assertNotEquals(strategy.signal(strategy.start), 0);
});
