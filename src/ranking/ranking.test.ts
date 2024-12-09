import { assertInstanceOf, assertNotEquals } from "@std/assert";
import { DateFormat } from "📚/time/mod.ts";

import { Ranking } from "📚/ranking/ranking.ts";
import { investor } from "📚/ranking/testdata.ts";
import { Model } from "📚/ranking/model.ts";
import { input_labels } from "📚/ranking/types.ts";
import { HeapBackend } from "📚/storage/mod.ts";

const model = Model.generate(input_labels.length);

Deno.test("Initialize", () => {
  const rank = new Ranking(model);
  assertInstanceOf(rank, Ranking);
});

Deno.test("Predict recent", () => {
  const rank = new Ranking(model);
  const out: number = rank.predict(investor);
  assertNotEquals(out, 0);
});

Deno.test("Predict at date", () => {
  const rank = new Ranking(model);
  const end: DateFormat = investor.chart.end;
  const out = rank.predict(investor, end);
  assertNotEquals(out, 0);
});

Deno.test("Loading", async () => {
  const repo = new HeapBackend();
  const rank = await Ranking.load(repo);
  assertInstanceOf(rank, Ranking);
});
