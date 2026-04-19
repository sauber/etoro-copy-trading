import { assertEquals, assertInstanceOf } from "@std/assert";
import { Instrument } from "@sauber/backtest";

import type { Mirror, StatsExport } from "📚/repository/mod.ts";
import { Tick } from "📚/tick/mod.ts";

import { Investor } from "./investor.ts";
import { Diary } from "./diary.ts";

const username = "john123";
const id = 1;
const fullname = "John Doe";
const start: Tick = 0;
const chart = new Instrument(new Float32Array([10000]), start, username);
const mirrors = new Diary<Mirror[]>({});
const stats = new Diary<StatsExport>({});

Deno.test("Initialization", () => {
  const investor = new Investor(username, id, fullname, chart, mirrors, stats);
  assertInstanceOf(investor, Investor);
});

Deno.test("Properties", () => {
  const investor = new Investor(username, id, fullname, chart, mirrors, stats);

  assertEquals(investor.isActive(start), true);
  assertEquals(investor.isFund, false);
  assertEquals(investor.isPopularInvestor, false);
});

Deno.test("Trim Chart", () => {
  const chart = new Instrument(
    new Float32Array([10000, 10000, 10000, 15000, 6000, 6000, 6000]),
    start,
    username,
  );
  const investor = new Investor(username, id, fullname, chart, mirrors, stats);
  const trimmed = investor.trimmed();
  assertEquals(trimmed.series, new Float32Array([10000, 15000, 6000]));
  assertEquals(trimmed.start, 2);
  assertEquals(trimmed.end, 4);
  assertEquals(trimmed.UserName, username);
  assertEquals(trimmed.CustomerID, id);
  assertEquals(trimmed.FullName, fullname);
});
