import { assertEquals, assertInstanceOf } from "@std/assert";
import type { DateFormat } from "📚/time/mod.ts";
import { Portfolio } from "./portfolio.ts";
import { investor, position } from "./testdata.ts";

const chart = investor.chart;
const start: DateFormat = chart.start;
const end: DateFormat = chart.end;
const first: number = chart.first;
const last: number = chart.last;
const amount: number = position.amount;

Deno.test("Instance", () => {
  const p = new Portfolio();
  assertInstanceOf(p, Portfolio);
});

Deno.test("Add position", () => {
  const p = new Portfolio();
  const a: Portfolio = p.add(position);
  assertEquals(a.length, 1);
});

Deno.test("Remove position", () => {
  const p = new Portfolio();
  const a: Portfolio = p.add(position);
  const r: Portfolio = a.remove(position);
  assertEquals(r.length, 0);
});

Deno.test("Aggregated Profit", () => {
  const p = new Portfolio([position, position]);
  assertEquals(p.profit(start), 0);
  const actual_profit: number = p.profit(end);
  const expected_profit: number = 2 * (last / first - 1) * amount;
  assertEquals(actual_profit, expected_profit);
});
