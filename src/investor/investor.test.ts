import { assertEquals, assertInstanceOf } from "@std/assert";
import { Investor } from "📚/investor/investor.ts";
import { Diary } from "📚/investor/diary.ts";
import { Bar, Chart } from "@sauber/backtest";
import type { Mirror, StatsExport } from "📚/repository/mod.ts";

const username = "john123";
const id = 1;
const fullname = "John Doe";
const end: Bar = 0;
const chart = new Chart(new Float32Array([10000]), end);
const mirrors = new Diary<Mirror[]>({});
const stats = new Diary<StatsExport>({});

Deno.test("Initialization", () => {
  const investor = new Investor(username, id, fullname, chart, mirrors, stats);
  assertInstanceOf(investor, Investor);
});

Deno.test("Properties", () => {
  const investor = new Investor(username, id, fullname, chart, mirrors, stats);

  assertEquals(investor.isActive(end), true);
  assertEquals(investor.isFund, false);
  assertEquals(investor.isPopularInvestor, false);
});
