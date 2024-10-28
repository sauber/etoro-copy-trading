import { assertInstanceOf } from "@std/assert";
import { TrainingData } from "📚/timing/trainingdata.ts";
import { community } from "📚/timing/testdata.ts";

Deno.test("Instance", ()=> {
  const t = new TrainingData(community);
  assertInstanceOf(t, TrainingData);
})