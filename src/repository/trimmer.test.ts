import { assertEquals, assertInstanceOf } from "@std/assert";
import { Trimmer } from "📚/repository/trimmer.ts";

Deno.test("Blank Initialization", () => {
  const chart = new Trimmer([], "2022-10-10");
  assertInstanceOf(chart, Trimmer);
});

Deno.test("Trimming", () => {
  const end = "2023-10-31";
  const chart = new Trimmer([10000, 10000, 6000, 6000], end);
  const trimmed = chart.trim;
  assertEquals(trimmed.values, [10000, 6000]);
});
