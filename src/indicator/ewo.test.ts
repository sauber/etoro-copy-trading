import { assertAlmostEquals, assertEquals, assertThrows } from "@std/assert";
import { EWO } from "./ewo.ts";

Deno.test("EWO - Basic Calculation", () => {
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const fast = 2;
  const slow = 5;
  const ewo = EWO(data, fast, slow);
  assertEquals(ewo[0], NaN);
  assertEquals(ewo[1], NaN);
  assertEquals(ewo[2], NaN);
  assertEquals(ewo[3], NaN);
  assertAlmostEquals(ewo[4], 1.11, 0.01);
  assertAlmostEquals(ewo[5], 1.23, 0.01);
  assertAlmostEquals(ewo[9], 1.45, 0.01);
});

Deno.test("EWO - Defaults", () => {
  const n = 40;
  const data = Array.from({ length: n }, (_, i) => i + 1);
  const ewo = EWO(data);
  assertEquals(ewo.length, n);
  assertAlmostEquals(ewo[n - 1], 12.8, 0.1);
});
