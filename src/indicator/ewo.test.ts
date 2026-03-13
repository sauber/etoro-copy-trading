import { assertEquals, assertThrows } from "@std/assert";
import { EWO } from "./ewo.ts";

Deno.test("EWO - Basic Calculation", () => {
  // Data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  // Fast SMA (2): [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5]
  // Slow SMA (5): [3, 4, 5, 6, 7, 8]
  // Offset (5-2=3)
  // EWO[0] = Fast[3] (4.5) - Slow[0] (3) = 1.5
  // EWO[1] = Fast[4] (5.5) - Slow[1] (4) = 1.5
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const fast = 2;
  const slow = 5;
  const ewo = EWO(data, fast, slow);
  assertEquals(ewo, [1.5, 1.5, 1.5, 1.5, 1.5, 1.5]);
});

Deno.test("EWO - Defaults", () => {
  // 1..40
  const data = Array.from({ length: 40 }, (_, i) => i + 1);
  // Slow (35) of 1..35 is 18.
  // Fast (5) of 31..35 is 33.
  // EWO = 33 - 18 = 15.
  const ewo = EWO(data);
  assertEquals(ewo.length, 40 - 35 + 1);
  assertEquals(ewo[0], 15);
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
    "Insufficient data to calculate EWO. Needs at least 5 data points.",
  );
});
