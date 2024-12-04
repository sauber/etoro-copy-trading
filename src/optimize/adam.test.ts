import { assertAlmostEquals, assertInstanceOf } from "@std/assert";
import { Adam } from "📚/optimize/adam.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Adam(), Adam);
});

Deno.test("Update", () => {
  const adam = new Adam();
  const update = adam.update(1);
  assertAlmostEquals(update, -0.1, 0.1);
});

Deno.test("Learning Rate", () => {
  const lr = 0.001;
  const adam = new Adam({learningRate: lr});
  const update = adam.update(1);
  assertAlmostEquals(update, -lr, lr);
});
