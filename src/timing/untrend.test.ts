import { Buffer } from "@sauber/backtest";
import { assertGreater, assertLess } from "@std/assert";
import { avg } from "@sauber/statistics";
import { detrendExponential } from "📚/timing/untrend.ts";

Deno.test("Convert buffer", () => {
  const s = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const flatten: Buffer = detrendExponential(new Float32Array(s));
  const mid: number = avg(s);
  assertLess(flatten[0], mid);
  assertGreater(flatten[4], mid);
  assertGreater(flatten[5], mid);
  assertLess(flatten[9], mid);
});
