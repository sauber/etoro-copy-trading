import { assert, assertEquals, assertInstanceOf } from "@std/assert";
import { Loader } from "./loader.ts";
import { assets } from "📚/trading/testdata.ts";
import { ParameterData } from "📚/trading/parameters.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Loader(assets), Loader);
});

Deno.test("Settings", async () => {
  const loader = new Loader(assets);
  const settings: ParameterData = await loader.settings();
  assert("weekday" in settings);
});

