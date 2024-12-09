import { assertEquals, assertInstanceOf } from "@std/assert";
import { HeapBackend, type JSONValue } from "📚/storage/mod.ts";
import { Config } from "📚/config/config.ts";

Deno.test("Get/Set", async (t) => {
  const repo = new HeapBackend();
  const config: Config = new Config(repo);
  assertInstanceOf(config, Config);

  await t.step("get unknown value", async () => {
    const value: JSONValue = await config.get("foo");
    assertEquals(value, null);
  });

  await t.step("set and get value", async () => {
    await config.set("foo", "bar");
    const value: JSONValue = await config.get("foo");
    assertEquals(value, "bar");
  });
});

Deno.test("Defaults", async (t) => {
  // Create new derived config object with defaults
  const repo = new HeapBackend();
  const configWithDefaults = new Config(repo, { standard: "normal" });

  await t.step("set default", async () => {
    const value: JSONValue = await configWithDefaults.get("standard");
    assertEquals(value, "normal");
  });
});
