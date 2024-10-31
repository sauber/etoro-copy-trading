import {
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import { Position } from "📚/portfolio/position.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { Exchange } from "./exchange.ts";
import { investor } from "./testdata.ts";

// Position data
const start: DateFormat = investor.chart.start;
const end: DateFormat = investor.chart.end;

// Exchange property
const spread = 0.02;
const amount = 1000;

Deno.test("Instance", () => {
  const ex = new Exchange();
  assertInstanceOf(ex, Exchange);
});

Deno.test("Buy and sell", () => {
  const ex = new Exchange(spread);

  // Buying
  const pos: Position = ex.buy(investor, start, amount);
  const opening_amount = amount - (amount * spread);
  assertEquals(pos.amount, opening_amount);
  assertEquals(pos.value(start), opening_amount);

  //Selling
  const gain = investor.chart.gain(start, end);
  const expected_value = (1 + gain) * opening_amount;
  const expected_payout: number = (1 - spread) * expected_value;
  const actual_payout = ex.sell(pos, end);
  assertAlmostEquals(actual_payout, expected_payout);
});
