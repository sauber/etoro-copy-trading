import { Series } from "@sauber/backtest";
import { assertEquals } from "@std/assert/equals";
import { demark_signal } from "📚/timing/demark-signal.ts";

Deno.test("Convert series", () => {
  const source: Series = new Float32Array([1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4 ,5, 4, 3, 2, 1]);
  const window = 1;
  const signals = demark_signal(source, window, 50, 50);
  assertEquals(signals[0], 0);
  assertEquals(signals[1], 0);
  assertEquals(signals[14], -0.5);
  assertEquals(signals[15], -0.25);
});
