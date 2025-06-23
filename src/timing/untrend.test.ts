import { Buffer } from "@sauber/backtest";
import { assertGreater, assertLess } from "@std/assert";
import { detrendExponential } from "📚/timing/untrend.ts";

Deno.test("Convert buffer", () => {
  const source: Buffer = new Float32Array([
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
  ]);
  const flatten = detrendExponential(source);
  const mid = 14.5; // Average of the source values
  assertLess(flatten[0], mid);
  assertGreater(flatten[4], mid);
  assertGreater(flatten[5], mid);
  assertLess(flatten[9], mid);
});
