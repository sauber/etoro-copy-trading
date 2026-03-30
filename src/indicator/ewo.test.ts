import { assertEquals, assertThrows } from "@std/assert";
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
  assertEquals(ewo[4], 1.5);
  assertEquals(ewo[5], 1.5);
  assertEquals(ewo[9], 1.5);
});

Deno.test("EWO - Defaults", () => {
  const n = 40;
  const data = Array.from({ length: n }, (_, i) => i + 1);
  const ewo = EWO(data);
  assertEquals(ewo.length, n);
  assertEquals(ewo[n - 1], 15);
});

Deno.test("EWO - Validation", () => {
  assertThrows(
    () => EWO([1, 2, 3], 5, 2),
    Error,
    "Slow period must be greater than or equal to fast period.",
  );
  assertThrows(
    () => EWO([1, 2], 2, 5),
    Error,
    "Insufficient data to calculate EWO. Needs at least 5 data points, got 2",
  );
});
