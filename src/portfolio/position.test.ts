import { assertEquals, assertInstanceOf } from "@std/assert";
import { Position } from "📚/portfolio/position.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { nextDate } from "📚/time/mod.ts";
import { investor } from "📚/portfolio/testdata.ts";

const chart = investor.chart;
const open: DateFormat = chart.start;
const expire: DateFormat = chart.end;
const first: number = chart.first;
const last: number = chart.last;
const amount = 1000;

Deno.test("Instance", () => {
  const pos = new Position(investor, open, amount);
  assertInstanceOf(pos, Position);
});

Deno.test("Profit", () => {
  const pos = new Position(investor, open, amount);
  const actual_profit = pos.profit(expire);
  const expected_profit = (last / first - 1) * amount;
  assertEquals(actual_profit, expected_profit);
});

Deno.test("Value", () => {
  const pos = new Position(investor, open, amount);
  const actual_value = pos.value(expire);
  const expected_value = amount + (last / first - 1) * amount;
  assertEquals(actual_value, expected_value);
});

Deno.test("Expire", () => {
  const pos = new Position(investor, open, amount);
  const expired: boolean = pos.expired(expire);
  assertEquals(expired, false);
  const expired2: boolean = pos.expired(nextDate(expire));
  assertEquals(expired2, true);
});

Deno.test("Limited", () => {
  const pos = new Position(investor, open, amount);
  const limited: boolean = pos.limited(expire);
  assertEquals(limited, false);
});

Deno.test("Open", () => {
  const pos = new Position(investor, open, amount);
  const keep: boolean = pos.open(expire);
  assertEquals(keep, true);
});
