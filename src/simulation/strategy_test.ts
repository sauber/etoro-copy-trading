import { assertEquals, assertInstanceOf } from "@std/assert";
import {
  ExitStrategy,
  NullStrategy,
  RandomStrategy,
  Strategy,
} from "./strategy.ts";
import { Order } from "../portfolio/order.ts";
import { Portfolio } from "../portfolio/portfolio.ts";
import { investor, community, position } from "../portfolio/testdata.ts";

const investors = await community.all();
const date = investor.chart.start;
const portfolio: Portfolio = new Portfolio();

Deno.test("Strategy Instance", () => {
  const s = new Strategy(investors);
  assertInstanceOf(s, Strategy);
});

Deno.test("Null Strategy", () => {
  const s = new NullStrategy(investors);
  assertEquals(s.order(portfolio, date).buyItems.length, 0);
});

Deno.test("Random Strategy", () => {
  const amount = 1000;
  const s = new RandomStrategy(investors, amount);
  const order: Order = s.order(portfolio, date);
  assertEquals(order.buyItems.length, 1);
  assertEquals(order.buyItems[0].amount, amount);
});

Deno.test("Exit Strategy", () => {
  const portfolio = new Portfolio().add(position);
  const s = new ExitStrategy(investors);
  const order: Order = s.order(portfolio, date);
  assertEquals(order.sellItems.length, 1);
  assertEquals(order.sellItems[0].reason, "exit");
  assertEquals(order.sellItems[0].position, position);
});
