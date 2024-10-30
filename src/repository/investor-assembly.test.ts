import { Investor } from "📚/investor/mod.ts";
import {
  assert,
  assertEquals,
  assertGreater,
  assertInstanceOf,
  assertNotEquals,
} from "@std/assert";
import { InvestorAssembly } from "📚/repository/investor-assembly.ts";
import type { MirrorsByDate, StatsByDate } from "./investor-assembly.ts";

import { InvestorId } from "📚/repository/mod.ts";
import { repo } from "📚/repository/testdata.ts";

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

Deno.test("CustomerId", async () => {
  const assembly = new InvestorAssembly(username, repo);
  assertEquals(await assembly.CustomerId(), customerid);
});

Deno.test("Full Name", async () => {
  const assembly = new InvestorAssembly("hech123", repo);
  assertEquals(await assembly.FullName(), "Martin Stewart Henshaw");
});

Deno.test("Start", async () => {
  const assembly = new InvestorAssembly(username, repo);
  assertEquals(await assembly.start(), "2021-02-01");
});

Deno.test("End", async () => {
  const assembly = new InvestorAssembly(username, repo);
  assertEquals(await assembly.end(), "2022-04-25");
});

Deno.test("Chart", async () => {
  const assembly = new InvestorAssembly(username, repo);
  const series: number[] = await assembly.chart();
  assertEquals(series.length, 449);
  assertEquals(series[0], 620.58);
  assertEquals(series[series.length - 1], 12565.32);
});

Deno.test("Stats", async () => {
  const assembly = new InvestorAssembly(username, repo);
  const stats: StatsByDate = await assembly.stats();
  assertEquals(Object.keys(stats), [
    "2022-02-05",
    "2022-02-12",
    "2022-04-18",
    "2022-04-25",
  ]);
});

Deno.test("Mirrors", async () => {
  const assembly = new InvestorAssembly(username, repo);
  const mirrors: MirrorsByDate = await assembly.mirrors();
  assertEquals(Object.keys(mirrors), [
    "2022-02-05",
    "2022-02-12",
    "2022-04-18",
    "2022-04-25",
  ]);

  // Confirm at least one mirror each date
  // Confirm mirrors have UserName
  Object.values(mirrors).forEach((ids: InvestorId[]) => {
    assertGreater(ids.length, 0);
    ids.forEach((id: InvestorId) => assertNotEquals(id.UserName, ""));
  });
});

Deno.test("Validate loadable", async () => {
  const assembly = new InvestorAssembly(username, repo);
  const ok: boolean = await assembly.validate();
  assertEquals(ok, true);
});

Deno.test("Combined Export", async () => {
  const assembly = new InvestorAssembly(username, repo);
  const investor: Investor = await assembly.investor();
  assertInstanceOf(investor, Investor);
  assert("UserName" in investor);
});

Deno.test("Compiled and cache investor", async () => {
  const assembly = new InvestorAssembly(username, repo);
  const investor: Investor = await assembly.compiled();
  assertInstanceOf(investor, Investor);
  assert("UserName" in investor);
});
