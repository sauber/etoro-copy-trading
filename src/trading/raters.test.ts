import { assertInstanceOf } from "@std/assert/instance-of";
import { makeRanker, makeTimer, Rater } from "📚/trading/raters.ts";
import { rankModel, timeModel } from "📚/trading/testdata.ts";

Deno.test("Ranking function", () => {
  const rater: Rater = makeRanker(rankModel);
  assertInstanceOf(rater, Function);
});

Deno.test("Timing function", () => {
  const rater: Rater = makeTimer(timeModel);
  assertInstanceOf(rater, Function);
});
