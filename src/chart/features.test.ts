import { assertEquals, assertInstanceOf } from "@std/assert";
import { Features, Samples } from "./features.ts";
import { investors } from "./testdata.ts";

Deno.test("Instance", () => {
  const features = new Features(investors, 5, 50, 2);
  assertInstanceOf(features, Features);
});

Deno.test("1 Sample", () => {
  const features = new Features(investors, 5, 50, 2);
  const count = 2;
  const samples: Samples = features.samples(count);
  assertEquals(samples.length, count);
});
