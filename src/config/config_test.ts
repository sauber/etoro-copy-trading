import { assertEquals } from "$std/assert/mod.ts";
import { HeapBackend } from "📚/repository/mod.ts";
import type { JSONValue } from "../repository/mod.ts";
import { Config } from "📚/config/config.ts";

Deno.test("Config", async (t) => {
  const repo = new HeapBackend();
  const config: Config = new Config(repo);

  await t.step("get unknown value", async () => {
    const value: JSONValue = await config.get("foo");
    assertEquals(value, null);
  });

  await t.step("set and get value", async () => {
    await config.set("foo", "bar");
    console.log(config);
    const value: JSONValue = await config.get("foo");
    assertEquals(value, "bar");
  });

  // Create new derived config object with defaults
  const configWithDefaults = config.withDefaults({ standard: "normal" });

  await t.step("set default", async () => {
    const value: JSONValue = await configWithDefaults.get("standard");
    assertEquals(value, "normal");
  });
});
