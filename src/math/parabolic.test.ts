import { assertAlmostEquals } from "@std/assert";
import { parabolic, type Point } from "📚/math/parabolic.ts";

Deno.test("Parabola Regression Peak", () => {
  const testData = [40, 42, 44, 40, 38, 42, 45, 48, 50];
  const x = [...Array(testData.length).keys()];
  const pairs: Array<Point> = x.map((x, i) => [x, testData[i]]);
  const p = parabolic(pairs);
  assertAlmostEquals(p.peak[0], 2.31, 0.01);
  assertAlmostEquals(p.peak[1], 40.30, 0.01);
});
