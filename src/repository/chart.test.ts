import { assertEquals, assertInstanceOf } from "@std/assert";
import { Chart } from "./chart.ts";
import type { ChartData } from "./chart.ts";
import { testAssets } from "./testdata.ts";
import { DateFormat, diffDate, today } from "📚/time/mod.ts";

const chartData: ChartData = testAssets.chart;
const end: DateFormat = "2023-10-13";

Deno.test("Initialization", () => {
  const chart = new Chart({ simulation: { oneYearAgo: { chart: [] } } });
  assertInstanceOf(chart, Chart);
});

Deno.test("Validate", () => {
  const chart: Chart = new Chart(chartData);
  assertEquals(chart.validate(), false);
});

Deno.test("Dates", () => {
  const chart: Chart = new Chart(chartData);
  assertEquals(chart.start, "2022-10-01");
  assertEquals(chart.end, end);
});

Deno.test("Values", () => {
  const chart: Chart = new Chart(chartData);
  const values: number[] = chart.values;
  assertEquals(values[0], 10000);
  assertEquals(values.length, 378);
});

Deno.test("maxAge", () => {
  const age: number = diffDate(end, today());
  console.log(`maxAge: ${age}`);
  assertEquals(new Chart(chartData, {maxAge: age}).validate(), true);
  assertEquals(new Chart(chartData, {maxAge: age-1}).validate(), false);
});
