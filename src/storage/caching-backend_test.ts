import { assertEquals, assertInstanceOf } from "$std/assert/mod.ts";
import { HeapBackend } from "./heap-backend.ts";
import { CachingBackend } from "./caching-backend.ts";
import type { JSONObject } from "./mod.ts";
import { Backend } from "./backend.ts";

const assetname = "foo";
const content = { name: "bar" };

Deno.test("Initialization", () => {
  const repo: CachingBackend = new CachingBackend(new HeapBackend());
  assertInstanceOf(repo, CachingBackend);
});

Deno.test("Create and delete Repo", async () => {
  const repo: CachingBackend = new CachingBackend(new HeapBackend());
  const names = await repo.names();
  assertEquals(names.length, 0);
});

Deno.test("Store and Retrieve", async () => {
  const repo: CachingBackend = new CachingBackend(new HeapBackend());

  const result = await repo.store(assetname, content);
  assertEquals(result, undefined);
  const names = await repo.names();
  assertEquals(names.length, 1);
  assertEquals(names, [assetname]);

  const investor: JSONObject = await repo.retrieve(assetname);
  assertEquals(investor, content);

  // Age is mostly positive number, but sometimes negative
  const _age: number = await repo.age(assetname);
});

Deno.test("Partition", async () => {
  const repo: CachingBackend = new CachingBackend(new HeapBackend());
  const sub: Backend = await repo.sub("sub");
  const names = await sub.names();
  assertEquals(names.length, 0);
});
