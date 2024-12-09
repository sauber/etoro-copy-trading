import { assertInstanceOf } from "@std/assert";
import { Investor } from "📚/investor/investor.ts";
import { Diary } from "📚/investor/diary.ts";
import { Chart } from "📚/chart/mod.ts";
import type { Mirror, StatsExport } from "📚/repository/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";

const username = "john123";
const id = 1;
const fullname = "John Doe";
const end: DateFormat = "2022-10-10";
const chart = new Chart([10000], end);
const mirrors = new Diary<Mirror[]>({});
const stats = new Diary<StatsExport>({});

Deno.test("Initialization", () => {
  const investor = new Investor(username, id, fullname, chart, mirrors, stats);
  assertInstanceOf(investor, Investor);
});
