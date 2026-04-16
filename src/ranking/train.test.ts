import { assertGreater, assertInstanceOf } from "@std/assert";
import { Train } from "📚/ranking/train.ts";
import { investors } from "📚/ranking/testdata.ts";
import { Model } from "📚/ranking/model.ts";
import { input_labels } from "📚/ranking/types.ts";

const model = Model.generate(input_labels.length);

Deno.test("Instance", () => {
  assertInstanceOf(new Train(model, investors), Train);
});

Deno.test("Run Training", () => {
  const train = new Train(model, investors, {
    epochs: 2,
    tick_count: 15,
  });
  const iterations: number = train.run();
  assertGreater(iterations, 1);
});
