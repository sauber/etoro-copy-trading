import {
  assertArrayIncludes,
  assertEquals,
  assertInstanceOf,
  assertNotEquals,
} from "@std/assert";
import { TrainingData } from "📚/ranking/trainingdata.ts";
import { chartStart, investors } from "📚/ranking/testdata.ts";
import { DataFrame } from "@sauber/dataframe";

Deno.test("Instance", () => {
  const t = new TrainingData(10, chartStart);
  assertInstanceOf(t, TrainingData);
});

Deno.test("Generate data", () => {
  const t = new TrainingData(10, chartStart);
  const fs: DataFrame = t.generate(investors);
  assertEquals(fs.length, 26);
  for (const f of fs.records) {
    assertArrayIncludes(Object.keys(f), ["Gain", "Score"]);
    assertNotEquals(f.output, 0);
  }
});
