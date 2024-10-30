import { assertInstanceOf, assertStringIncludes } from "@std/assert";
import { FetchURL } from "./fetch-url.ts";
import { discoverFilter, investorId } from "./testdata.ts";

Deno.test("Initialization", () => {
  const f: FetchURL = new FetchURL();
  assertInstanceOf(f, FetchURL);
});

Deno.test("discover", () => {
  const f: FetchURL = new FetchURL();
  const url = f.discover(discoverFilter);
  assertStringIncludes(url, "maxmonthlyriskscoremax=" + discoverFilter.risk);
  assertStringIncludes(url, "dailyddmin=-" + discoverFilter.daily);
  assertStringIncludes(url, "weeklyddmin=-" + discoverFilter.weekly);
});

Deno.test("chart", () => {
  const f: FetchURL = new FetchURL();
  const url = f.chart(investorId);
  assertStringIncludes(url, "/chart/public/" + investorId.UserName);
});

Deno.test("portfolio", () => {
  const f: FetchURL = new FetchURL();
  const url = f.portfolio(investorId);
  assertStringIncludes(url, "portfolios?cid=" + investorId.CustomerId);
});

Deno.test("stats", () => {
  const f: FetchURL = new FetchURL();
  const url = f.stats(investorId);
  assertStringIncludes(url, "/rankings/cid/" + investorId.CustomerId);
});
