import { assertEquals, assertInstanceOf } from "@std/assert";
import { Chart } from "📚/chart/chart2.ts";

function makeBuffer(values: number[] = []): Float32Array {
  return new Float32Array(values);
}

Deno.test("Blank Initialization", () => {
  const chart = new Chart(makeBuffer());
  assertInstanceOf(chart, Chart);
});

Deno.test("Trimming", () => {
  const chart = new Chart(makeBuffer([10000, 10000, 8000, 6000, 6000]));
  const trimmed = chart.trim;
  assertEquals(trimmed.length, 3);
  assertEquals(trimmed.values, makeBuffer([10000, 8000, 6000]));
  assertEquals(trimmed.end, 1);
});
