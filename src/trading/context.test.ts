import { assert, assertEquals, assertInstanceOf } from "@std/assert";
import { Backend, HeapBackend } from "@sauber/journal";
import { DateFormat } from "📚/tick/mod.ts";
import { Instrument, Portfolio } from "@sauber/backtest";

import { makeTestRepository } from "../repository/mod.ts";
import { Settings } from "../signal/mod.ts";

import { Context } from "./context.ts";

const repo: Backend = makeTestRepository();

Deno.test("Instance", () => {
  const heap = new HeapBackend();
  const context = new Context(heap);
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

Deno.test("Trading Tick", async () => {
  const context = new Context(repo);
  const tick = await context.tradingTick();
  assertEquals(tick, 510);
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
  const instr: Instrument[] = await context.tradingInstruments();
  assertEquals(instr.length, 13);
});

Deno.test("Value", async () => {
  const context = new Context(repo);
  const value: number = await context.value();
  assertEquals(value, 100000);
});

Deno.test("Positions", async () => {
  const context = new Context(repo);
  const p: Portfolio = await context.portfolio();
  assertEquals(p.positions.length, 20);
});
