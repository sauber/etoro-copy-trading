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
  assertLess(flatten[0], 10);
  assertGreater(flatten[4], 10);
  assertGreater(flatten[5], 10);
  assertLess(flatten[9], 10);
});
