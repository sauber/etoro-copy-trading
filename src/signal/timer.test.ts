import { assertEquals, assertInstanceOf } from "@std/assert";
import { HeapBackend } from "@sauber/journal";
import { Rater } from "../strategy/mod.ts";
import { createTimer, loadSettings, loadTimer, saveSettings } from "./timer.ts";
import { type Input, inputParameters } from "./indicator.ts";

// Default values for signal
const defaults: Input = Object.fromEntries(
  Object.entries(inputParameters).map(([name, param]) => [name, param.default]),
);

// Create repo
const repo = new HeapBackend();

/** Confirm that createTimer() function successfully returns a Rater function */
Deno.test("createTimer", () => {
  const timer: Rater = createTimer(defaults);
  assertInstanceOf(timer, Function);
});

/** Confirm settings can be saved */
Deno.test("save settings", async () => {
  const result = await saveSettings(repo, defaults);
  assertEquals(result, undefined);
});

/** Confirm that loadTimer() function successfully returns a Rater function */
Deno.test("loadTimer", async () => {
  const timer: Rater = await loadTimer(repo);
  assertInstanceOf(timer, Function);
});

/** Confirm settings can be loaded */
Deno.test("load settings", async () => {
  const settings: Input = await loadSettings(repo);
  assertInstanceOf(settings, Object);
});
