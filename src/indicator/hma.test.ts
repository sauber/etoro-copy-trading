import { assertEquals } from "@std/assert";
import { HMA } from "./hma.ts";

Deno.test("HMA", () => {
  const input = [1, 2, 3, 4, 5, 6];
  const period = 4;
  const output = HMA(input, period);
  console.log(output);
  assertEquals(output, [5, 6]);
});
