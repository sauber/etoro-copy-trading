import {
  assertArrayIncludes,
  assertEquals,
  assertInstanceOf,
  assertNotEquals,
} from "@std/assert";
import { DataFrame } from "@sauber/dataframe";

import { TrainingData } from "./trainingdata.ts";
import { investors } from "./testdata.ts";

Deno.test("Instance", () => {
  const t = new TrainingData(10);
  assertInstanceOf(t, TrainingData);
});

Deno.test("Generate data", () => {
  const t = new TrainingData(10);
  const fs: DataFrame = t.generate(investors);
  assertEquals(fs.length, 26);
  for (const f of fs.records) {
    assertArrayIncludes(Object.keys(f), ["Gain", "Score"]);
    assertNotEquals(f.output, 0);
  }
});
