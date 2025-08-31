import { assertEquals, assertInstanceOf } from "@std/assert";

import { limits } from "📚/signal/mod.ts";

import { Parameters } from "./parameters.ts";

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

Deno.test("random", () => {
  const p = Parameters.fromLimits(limits);
  const q = p.random();
  assertInstanceOf(q, Parameters);
  assertEquals(q.names(), p.names());
})

