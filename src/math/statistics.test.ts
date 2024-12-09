import { assertEquals, assertAlmostEquals } from "@std/assert";
import { sum, avg, std } from "📚/math/statistics.ts";

Deno.test("Sum", () => {
  const testData = [10, 20, 30, 40, 50, 60];
  const result = sum(testData);
  assertEquals(result, 210);
});

Deno.test("Average", () => {
  const testData = [10, 20, 30, 40, 50, 60];
  const result = avg(testData);
  assertEquals(result, 35);
});

Deno.test("Standard Deviation", () => {
  const testData = [10, 20, 30, 40, 50, 60];
  const result = std(testData);
  assertAlmostEquals(result, 18.7, 0.1);
});
