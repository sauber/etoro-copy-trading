import { assertEquals, assertInstanceOf } from "@std/assert";
import { Samples } from "./samples.ts";
import { investors } from "./testdata.ts";
import { Features } from "./features.ts";

Deno.test("Instance", () => {
  const samples = new Samples(investors, 5, 50, 2);
  assertInstanceOf(samples, Samples);
});

Deno.test("Samples", () => {
  const features = new Samples(investors, 5, 50, 2);
  const count = 2;
  const samples: Features[] = features.samples(count);
  assertEquals(samples.length, count);
});
