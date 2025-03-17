import { Buffer } from "@sauber/backtest";
import { assertEquals } from "@std/assert/equals";
import { demark_signal } from "📚/timing/demark-signal.ts";

Deno.test("Convert buffer", () => {
  const source: Buffer = new Float32Array([1, 2, 3, 4, 5, 4]);
  const window = 1;
  const signals = demark_signal(source, window);
  assertEquals(signals[0], 0);
  assertEquals(signals[1], -1);
  assertEquals(signals[4], -0.25);
  assertEquals(signals[5], 0.25);
});
