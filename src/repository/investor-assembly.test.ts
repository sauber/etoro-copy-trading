import type { Instrument, Series } from "@sauber/backtest";
import { JournaledAsset } from "@sauber/journal";
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
  assertNotEquals,
} from "@std/assert";

import { Investor } from "📚/investor/mod.ts";
import { DateFormat, nextDate } from "📚/tick/mod.ts";

import { InvestorAssembly, type InvestorExport } from "./investor-assembly.ts";
import { repo } from "./testdata.ts";
import type { InvestorId } from "./types.ts";
import { Timeline } from "📚/tick/timeline.ts";

// Test Data
const username = "Schnaub123";
const customerid = 2792934;
const startDate: DateFormat = "2020-12-01";
const timeline = new Timeline(nextDate(startDate, -1));

Deno.test("Blank Initialization", () => {
  const assembly: InvestorAssembly = new InvestorAssembly(
    username,
    repo,
    timeline,
  );
  assertInstanceOf(assembly, InvestorAssembly);
});

Deno.test("UserName", () => {
  const assembly = new InvestorAssembly(username, repo, timeline);
  const name: string = assembly.UserName;
  assertEquals(name, username);
});

Deno.test("Caching", async () => {
  const assembly = new InvestorAssembly(username, repo, timeline);
  const _investor: Investor = await assembly.investor();
  const asset = new JournaledAsset<InvestorExport>(
    username + ".compiled",
    repo,
  );
  assert(await asset.exists());
});

Deno.test("CustomerId", async () => {
  const assembly = new InvestorAssembly(username, repo, timeline);
  const investor: Investor = await assembly.investor();
  assertEquals(investor.CustomerID, customerid);
});

Deno.test("FullName", async () => {
  const assembly = new InvestorAssembly("hech123", repo, timeline);
  const investor: Investor = await assembly.investor();
  assertEquals(investor.FullName, "Martin Stewart Henshaw");
});

Deno.test("Chart", async () => {
  const assembly = new InvestorAssembly(username, repo, timeline);
  const investor: Investor = await assembly.investor();
  const chart: Instrument = investor;
  const series: Series = chart.series;
  assertEquals(series.length, 449);
  assertAlmostEquals(series[0], 620.58);
  assertAlmostEquals(series[series.length - 1], 12565.32);
});

Deno.test("Stats", async () => {
  const assembly = new InvestorAssembly(username, repo, timeline);
  const investor: Investor = await assembly.investor();
  const stats = investor.stats;
  assertEquals(stats.ticks, [432, 439, 504, 511]);
});

Deno.test("Mirrors", async () => {
  const assembly = new InvestorAssembly(username, repo, timeline);
  const investor: Investor = await assembly.investor();
  const mirrors = investor.mirrors;
  assertEquals(mirrors.ticks, [432, 439, 504, 511]);
  const mirror: InvestorId[] = mirrors.last;
  for (const id in mirror) {
    assertNotEquals(id, "");
  }
});

Deno.test("Test Investor", async () => {
  const assembly = new InvestorAssembly(username, repo, timeline);
  const investor: Investor = await assembly.testInvestor();
  assertInstanceOf(investor, Investor);
  const chart: Instrument = investor;
  const series: Series = chart.series;
  assertEquals(series.length, 449);
  assertAlmostEquals(series[0], 3190.99);
  assertAlmostEquals(series[series.length - 1], 9943.52);
});
