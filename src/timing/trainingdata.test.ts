import { assertGreater, assertInstanceOf } from "@std/assert";
import { TrainingData } from "📚/timing/trainingdata.ts";
import { community } from "📚/timing/testdata.ts";
import { Instruments } from "@sauber/backtest";

Deno.test("Instance", () => {
  const t = new TrainingData(community);
  assertInstanceOf(t, TrainingData);
});

Deno.test("Loading", async () => {
  const t = new TrainingData(community);
  const instr: Instruments = await t.load();
  assertGreater(instr.length, 0);
});
