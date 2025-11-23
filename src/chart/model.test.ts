import { Network } from "@sauber/neurons";
import { Model } from "./model.ts";
import { assertEquals, assertInstanceOf } from "@std/assert";
import { temprepo } from "./testdata.ts";

Deno.test("Instance", () => {
  const network = new Network(1);
  const model = new Model(network);
  assertInstanceOf(model, Model);
});

Deno.test("Generate", () => {
  const model = Model.generate();
  assertInstanceOf(model, Model);
});

Deno.test("Missing asset", async () => {
  const model = await Model.load(temprepo);
  assertEquals(model, false);
});

Deno.test("Save/load", async () => {
  // Save
  const model = Model.generate();
  await model.save(temprepo);

  // Load
  const loaded = await Model.load(temprepo);
  assertInstanceOf(loaded, Model);
});
