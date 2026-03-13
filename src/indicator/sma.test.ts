import { assertEquals, assertThrows } from "@std/assert";
import { SMA } from "./sma.ts";

Deno.test("SMA - Basic Calculation", () => {
  const data = [10, 20, 30, 40, 50];
  const period = 3;
  const sma = SMA(data, period);
  assertEquals(sma, [20, 30, 40]);
});

Deno.test("SMA - Insufficient Data", () => {
  const data = [1, 2];
  const period = 3;
  assertThrows(
    () => SMA(data, period),
    Error,
    "Insufficient data to calculate SMA.",
  );
});
