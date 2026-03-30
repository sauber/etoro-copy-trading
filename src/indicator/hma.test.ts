import { assertEquals } from "@std/assert";
import { HMA } from "./hma.ts";

Deno.test("HMA", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const period = 4;
  const output = HMA(input, period);
  assertEquals(output, [, NaN, NaN, NaN, 9, 10, 11, 12, NaN, NaN]);
});
