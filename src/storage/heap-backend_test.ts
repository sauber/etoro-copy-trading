import { HeapBackend } from "./heap-backend.ts";
import type { JSONObject, AssetName, AssetNames } from "./mod.ts";
import { assertEquals, assertInstanceOf, assertLess } from "@std/assert";

const name: AssetName = "foo";
const data: JSONObject = { name: "bar" };

Deno.test("Initialization", () => {
  const repo: HeapBackend = new HeapBackend();
  assertInstanceOf(repo, HeapBackend);
});

Deno.test("Create", async () => {
  const repo: HeapBackend = new HeapBackend();
  const names = await repo.names();
  assertEquals(names.length, 0);
});

Deno.test("Store and Retrieve Asset", async () => {
  const repo: HeapBackend = new HeapBackend();

  const result = await repo.store(name, data);
  assertEquals(result, undefined);
  const names: AssetNames = await repo.names();
  assertEquals(names.length, 1);
  assertEquals(names, [name]);

  const investor: JSONObject = await repo.retrieve(name);
  assertEquals(investor, data);

  const age: number = await repo.age(name);
  assertLess(age, 10);
});
