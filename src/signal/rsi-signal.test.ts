import { Series } from "@sauber/backtest";
import { assertEquals } from "@std/assert/equals";
import { rsi_signal } from "./rsi-signal.ts";

Deno.test("Convert series", () => {
  const source: Series = new Float32Array([1, 2, 3, 4, 5]);
  const buy_window = 2;
  const buy_threshold = 30;
  const sell_window = 2;
  const sell_threshold = 70;
  const signals = rsi_signal(
    source,
    buy_window,
    buy_threshold,
    sell_window,
    sell_threshold,
  );
  assertEquals(signals, new Float32Array([-1, -1, -1]));
});
