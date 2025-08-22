import { Series } from "@sauber/backtest";
import { assertEquals } from "@std/assert/equals";
import { signal as rsi } from "./rsi.ts";

Deno.test("Convert series", () => {
  const source: Series = new Float32Array([1, 2, 3, 4, 5]);
  const buy_window = 2;
  const buy = 30;
  const sell_window = 2;
  const sell = 70;
  const signals = rsi(source, { buy_window, buy, sell_window, sell });
  assertEquals(signals, new Float32Array([0, 0, 1, 1, 1]));
});
