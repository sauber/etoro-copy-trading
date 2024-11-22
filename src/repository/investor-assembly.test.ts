import { Investor } from "📚/investor/mod.ts";
import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertNotEquals,
} from "@std/assert";
import {
  InvestorAssembly,
  type InvestorExport,
} from "📚/repository/investor-assembly.ts";

// import { InvestorId } from "📚/repository/mod.ts";
import { repo } from "📚/repository/testdata.ts";
import type { InvestorId } from "📚/repository/types.ts";
import type { Chart } from "📚/chart/mod.ts";
import { Asset } from "📚/storage/mod.ts";

// Test Data
const username = "Schnaub123";
const customerid = 2792934;

Deno.test("Blank Initialization", () => {
  const assembly: InvestorAssembly = new InvestorAssembly(username, repo);
  assertInstanceOf(assembly, InvestorAssembly);
});

Deno.test("UserName", () => {
  const assembly = new InvestorAssembly(username, repo);
  const name: string = assembly.UserName;
  assertEquals(name, username);
});

Deno.test("Caching", async () => {
  const assembly = new InvestorAssembly(username, repo);
  const _investor: Investor = await assembly.investor();
  const asset = new Asset<InvestorExport>(username + ".compiled", repo);
  assert(await asset.exists());
});

Deno.test("CustomerId", async () => {
  const assembly = new InvestorAssembly(username, repo);
  const investor: Investor = await assembly.investor();
  assertEquals(investor.CustomerID, customerid);
});

Deno.test("FullName", async () => {
  const assembly = new InvestorAssembly("hech123", repo);
  const investor: Investor = await assembly.investor();
  assertEquals(investor.FullName, "Martin Stewart Henshaw");
});

Deno.test("Chart", async () => {
  const assembly = new InvestorAssembly(username, repo);
  const investor: Investor = await assembly.investor();
  const chart: Chart = investor.chart;
  const series: number[] = chart.values;
  assertEquals(series.length, 449);
  assertEquals(series[0], 620.58);
  assertEquals(series[series.length - 1], 12565.32);
});

Deno.test("Stats", async () => {
  const assembly = new InvestorAssembly(username, repo);
  const investor: Investor = await assembly.investor();
  const stats = investor.stats;
  assertEquals(stats.dates, [
    "2022-02-05",
    "2022-02-12",
    "2022-04-18",
    "2022-04-25",
  ]);
});

Deno.test("Mirrors", async () => {
  const assembly = new InvestorAssembly(username, repo);
  const investor: Investor = await assembly.investor();
  const mirrors = investor.mirrors;
  assertEquals(mirrors.dates, ["2022-02-05"]);
  const mirror: InvestorId[] = mirrors.last;
  for (const id in mirror) {
    assertNotEquals(id, "");
  }
});
