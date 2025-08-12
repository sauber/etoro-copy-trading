import { HeapBackend } from "@sauber/journal";
import { Account } from "./account.ts";
import { assertEquals, assertRejects } from "@std/assert";
import { Config } from "../config/mod.ts";

Deno.test("No Account", async () => {
  const repo = new HeapBackend();
  const account = new Account(repo);
  await assertRejects(async () => await account.username());
});

Deno.test("Account Proporties", async () => {
  // Load config with account data
  const UserName = "foo";
  const Value = 1000;
  const repo = new HeapBackend();
  const config = new Config(repo);
  await config.set("account", { UserName, Value });

  // Confirm account loads data from config
  const account = new Account(repo);
  const username = await account.username();
  assertEquals(username, UserName);
  const value = await account.value();
  assertEquals(value, Value);
});

Deno.test("Define username", async () => {
  // Load config with account data
  const UserName = "foo";
  const repo = new HeapBackend();

  // Confirm account loads data from config
  const account = new Account(repo);
  await account.setUsername(UserName);
  const username = await account.username();
  assertEquals(username, UserName);
});
