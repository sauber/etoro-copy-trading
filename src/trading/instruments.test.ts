import { assertEquals, assertInstanceOf } from "@std/assert";
import { Backend, HeapBackend } from "@sauber/journal";
import { Instrument } from "@sauber/backtest";

import { makeTestRepository } from "📚/repository/mod.ts";

import { Instruments } from "📚/trading/instruments.ts";

const repo: Backend = makeTestRepository();
const tick = 510;

Deno.test("Instance", () => {
  const heap = new HeapBackend();
  const context = new Instruments(heap, tick);
  assertInstanceOf(context, Instruments);
});

Deno.test("Available Investors", async () => {
  const context = new Instruments(repo, tick);
  const instr: Instrument[] = await context.tradingInstruments();
  assertEquals(instr.length, 13);
});
