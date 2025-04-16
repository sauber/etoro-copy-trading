import {
  assertArrayIncludes,
  assertGreater,
  assertInstanceOf,
  assertNotEquals,
} from "@std/assert";
import { TrainingData } from "📚/ranking/trainingdata.ts";
import { investors } from "📚/ranking/testdata.ts";
import { DataFrame } from "@sauber/dataframe";

Deno.test("Instance", () => {
  const t = new TrainingData(10);
  assertInstanceOf(t, TrainingData);
});

Deno.test("Generate data", () => {
  const t = new TrainingData(10);
  const fs: DataFrame = t.generate(investors);
  assertGreater(fs.length, 0);
  for (const f of fs.records) {
    assertArrayIncludes(Object.keys(f), ["Gain", "Score"]);
    assertNotEquals(f.output, 0);
  }
});
