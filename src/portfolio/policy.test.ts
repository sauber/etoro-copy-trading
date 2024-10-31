import {
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import { Portfolio } from "📚/portfolio/portfolio.ts";
import { Position } from "📚/portfolio/position.ts";
import { IPolicy, Policy } from "📚/portfolio/policy.ts";
import type { BuyItems, SellItems } from "📚/portfolio/order.ts";
import { community } from "📚/portfolio/testdata.ts";
import { Chart } from "📚/chart/mod.ts";
import * as modTs from "📚/time/mod.ts";
import { sum } from "📚/math/statistics.ts";

const start: modTs.DateFormat = "2021-12-29";
const name = "FundManagerZech";
const investor = await community.investor(name);
const name2 = "Robier89";
const investor2 = await community.investor(name2);
const pos: Position = new Position(investor, start, 5000);
const pos2: Position = new Position(investor2, start, 5000);

const empty: IPolicy = {
  portfolio: new Portfolio(),
  chart: new Chart([], start),
  investors: [],
  conviction: {},
  date: start,
  cash: 0,
  targets: 0,
};

Deno.test("Instance", () => {
  const p = new Policy(empty);
  assertInstanceOf(p, Policy);
});

Deno.test("Empty Data", () => {
  const p = new Policy(empty);
  const buy: BuyItems = p.buy;
  assertEquals(buy.length, 0);
});

Deno.test("Buy 100% of investor with positive rank", () => {
  const positive = Object.assign({}, empty, {
    investors: [investor],
    conviction: { [name]: 1 },
    cash: 10000,
    targets: 1,
  });
  const p = new Policy(positive);
  const buy: BuyItems = p.buy;
  assertEquals(buy.length, 1);
  assertEquals(buy[0].investor.UserName, name);
  assertEquals(buy[0].amount, 10000);
});

Deno.test("Buy 0% of investor with negative rank", { ignore: true }, () => {
  const positive = Object.assign({}, empty, {
    investors: [investor],
    conviction: { [name]: -1 },
    cash: 10000,
    targets: 1,
  });
  const p = new Policy(positive);
  const buy: BuyItems = p.buy;
  assertEquals(buy.length, 0);
});

Deno.test("Buy count within targets", { ignore: true }, () => {
  const zero = Object.assign({}, empty, {
    investors: [investor],
    conviction: { [name]: 1 },
    cash: 10000,
  });
  assertEquals(new Policy(zero).buy.length, 0);

  const one = Object.assign({}, zero, { targets: 1 });
  assertEquals(new Policy(one).buy.length, 1);

  const two = Object.assign({}, zero, { targets: 2 });
  assertEquals(new Policy(two).buy.length, 1);
});

Deno.test("Buy two equally ranked investors", () => {
  const equal = Object.assign({}, empty, {
    investors: [investor, investor2],
    conviction: { [name]: 1, [name2]: 1 },
    cash: 10000,
    targets: 2,
  });
  const p = new Policy(equal);
  const buy: BuyItems = p.buy;
  assertEquals(buy.length, 2);
  assertEquals(buy[0].amount, 5000);
  assertEquals(buy[1].amount, 5000);
});

Deno.test("Buy two inequally ranked investors", { ignore: true }, () => {
  const inequal = Object.assign({}, empty, {
    investors: [investor, investor2],
    conviction: { [name]: 1, [name2]: 2 },
    cash: 10000,
    targets: 2,
  });
  const p = new Policy(inequal);
  const buy: BuyItems = p.buy;
  assertEquals(buy.length, 2);
  assertEquals(sum(buy.map((i) => i.amount)), 10000);
  assertAlmostEquals(buy[0].amount, 5579, 1);
  assertAlmostEquals(buy[1].amount, 4421, 1);
});

Deno.test("Sell nothing from empty portfolio", () => {
  const p = new Policy(empty);
  const sell: SellItems = p.sell;
  assertEquals(sell.length, 0);
});

Deno.test("Sell nothing from populated portfolio", () => {
  const one = Object.assign({}, empty, {
    portfolio: new Portfolio([pos]),
    targets: 1,
    conviction: { [name]: 1 },
  });
  const p = new Policy(one);
  const sell: SellItems = p.sell;
  assertEquals(sell.length, 0);
});

Deno.test("Sell from populated portfolio to meet target count", () => {
  const one = Object.assign({}, empty, {
    portfolio: new Portfolio([pos]),
    targets: 0,
    conviction: { [name]: 1 },
  });
  const p = new Policy(one);
  const sell: SellItems = p.sell;
  assertEquals(sell.length, 1);
});

Deno.test("Sell unranked from populated portfolio", () => {
  const one = Object.assign({}, empty, {
    portfolio: new Portfolio([pos]),
    targets: 1,
  });
  const p = new Policy(one);
  const sell: SellItems = p.sell;
  assertEquals(sell.length, 1);
});

Deno.test("Sell negative ranked from populated portfolio", () => {
  const one = Object.assign({}, empty, {
    portfolio: new Portfolio([pos]),
    conviction: { [name]: -1 },
    targets: 1,
  });
  const p = new Policy(one);
  const sell: SellItems = p.sell;
  assertEquals(sell.length, 1);
});

Deno.test("Buy more of already opened position", () => {
  const one = Object.assign({}, empty, {
    portfolio: new Portfolio([pos]),
    conviction: { [name]: 1 },
    targets: 1,
    cash: 5000,
  });
  const p = new Policy(one);
  const buy: BuyItems = p.buy;
  assertEquals(buy.length, 1);
  assertEquals(buy[0].amount, 5000);
});
