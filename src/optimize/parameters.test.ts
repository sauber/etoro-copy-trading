import { assertEquals, assertInstanceOf } from "@std/assert";
import { Parameters } from "./parameters.ts";
import { limits } from "../signal/mod.ts";

Deno.test("Blank Instance", () => {
  const p = new Parameters([]);
  assertInstanceOf(p, Parameters);
});

Deno.test("From Limits", () => {
  const p = Parameters.fromLimits(limits);
  assertInstanceOf(p, Parameters);
});

Deno.test("Key Names", () => {
  const p = Parameters.fromLimits(limits);
  assertEquals(p.names(), Object.keys(limits));
});

