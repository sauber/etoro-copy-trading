import { assertEquals, assertInstanceOf, assertNotEquals } from "@std/assert";
import { Parameters } from "📚/optimize/parameters.ts";
import { Parameter } from "📚/optimize/parameter.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Parameters(), Parameters);
});

Deno.test("Import / Export", () => {
  const list = new Parameters([new Parameter("", 0, 0)]);
  const exported = list.export();
  const imported = Parameters.import(exported);
  assertEquals(imported.export, list.export);
});

Deno.test("Random", () => {
  const list = new Parameters([new Parameter("a", 0, 5)]);
  const random = list.random;
  assertNotEquals(list.get("a").value, random.get("a").value);
  assertEquals(list.get("a").min, random.get("a").min);
});

Deno.test("List", () => {
  const ps = new Parameters([new Parameter("a", 0, 5)]);
  const list: Array<Parameter> = ps.all;
  assertEquals(list.map(p=>p.name), ["a"]);
});
