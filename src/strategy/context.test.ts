import { assert, assertEquals, assertInstanceOf } from "@std/assert";
import { Backend, HeapBackend } from "@sauber/journal";
import { DateFormat } from "@sauber/dates";
import { Instrument, Instruments, StrategyContext } from "@sauber/backtest";

import { makeTestRepository } from "../repository/mod.ts";
import { Settings } from "../signal/mod.ts";

import { Context } from "./context.ts";

const repo: Backend = makeTestRepository();

Deno.test("Instance", () => {
  const repo = new HeapBackend();
  const context = new Context(repo);
  assertInstanceOf(context, Context);
});

Deno.test("Settings", async () => {
  const context = new Context(repo);
  const settings: Settings = await context.settings();
  assertInstanceOf(settings, Object);
});

Deno.test("Trading Date", async () => {
  const context = new Context(repo);
  const date: DateFormat = await context.tradingDate();
  assertEquals(date, "2022-04-25");
});

Deno.test("Username", async () => {
  const context = new Context(repo);
  const name: string = await context.username();
  assertEquals(name, "GainersQtr");
});

Deno.test("Any Instrument", async () => {
  const context = new Context(repo);
  const instr: Instrument = await context.anyInstrument();
  assert("UserName" in instr);
});

Deno.test("Available Investors", async () => {
  const context = new Context(repo);
  const instr: Instruments = await context.tradingInstruments();
  assertEquals(instr.length, 13);
});

Deno.test("Strategy Context", async () => {
  const context = new Context(repo);
  const ctx: StrategyContext = await context.strategyContext();
  assert("bar" in ctx);
  assert("value" in ctx);
  assert("amount" in ctx);
  assert("purchaseorders" in ctx);
  assert("closeorders" in ctx);
  assert("positions" in ctx);
});
