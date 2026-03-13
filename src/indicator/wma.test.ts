import { assertEquals } from "@std/assert";
import { WMA } from "./wma.ts";

Deno.test("WMA", () => {
  const data = [1, 2, 3, 4, 5];
  const period = 4;
  const wma = WMA(data, period);
  assertEquals(wma, [3, 4]);
});
