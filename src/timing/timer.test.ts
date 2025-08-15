import { assertInstanceOf } from "@std/assert";
import { Rater } from "../strategy/mod.ts";
import { createTimer, loadTimer, saveTimer } from "./timer.ts";
import { makeTestRepository } from "../repository/mod.ts";
import { HeapBackend } from "@sauber/journal";

/** Confirm that createTimer() function successfully returns a Rater function */
Deno.test("createTimer", () => {
  const timer: Rater = createTimer({
    window: 14,
    smoothing: 3,
    buy: 20,
    sell: 80,
  });
  assertInstanceOf(timer, Function);
});

/** Confirm that loadTimer() function successfully returns a Rater function */
Deno.test("loadTimer", async () => {
  const timer: Rater = await loadTimer(makeTestRepository());
  assertInstanceOf(timer, Function);
});

/** Confirm that signal parameters can be stored */
Deno.test("storeTimer", async () => {
  const settings = {
    window: 14,
    smoothing: 3,
    buy: 20,
    sell: 80,
  };
  const repo = new HeapBackend();
  await saveTimer(repo, settings);
});
