import {
  assertEquals,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertNotEquals,
} from "@std/assert";
import { type Samples, TrainingData } from "📚/ranking/trainingdata.ts";
import { investor } from "📚/ranking/testdata.ts";

Deno.test("Instance", () => {
  const t = new TrainingData(10);
  assertInstanceOf(t, TrainingData);
});

Deno.test("Generate data", () => {
  const t = new TrainingData(10);
  const fs: Samples = t.features(investor);
  assertGreaterOrEqual(fs.length, 0);
  for (const f of fs) {
    assertEquals(Object.keys(f), ["input", "output"]);
    assertNotEquals(f.output.SharpeRatio, 0);
  }
});
