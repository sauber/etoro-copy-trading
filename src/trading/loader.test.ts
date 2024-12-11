import {
assert,
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import { Loader } from "./loader.ts";
import { assets } from "📚/trading/testdata.ts";
import {
  Amount,
  Bar,
  Positions,
  PurchaseOrders,
  StrategyContext,
} from "@sauber/backtest";
import { diffDate, today } from "📚/time/mod.ts";
import { Mirror } from "📚/repository/mod.ts";
import { Parameters } from "📚/trading/trading-strategy.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Loader(assets), Loader);
});

Deno.test("Trading Day", async () => {
  const loader = new Loader(assets);
  const trading: Bar = await loader.tradingBar();
  assertEquals(trading, diffDate("2022-04-25", today()));
});

Deno.test("Value", async () => {
  const loader = new Loader(assets);
  const value: Amount = await loader.value();
  assertEquals(value, (await assets.config.get("account") as Mirror).Value);
});

Deno.test("Amount", async () => {
  const loader = new Loader(assets);
  const amount: Amount = await loader.amount();
  assertAlmostEquals(amount, 12.5);
});

Deno.test("Purchase Orders", async () => {
  const loader = new Loader(assets);
  const po: PurchaseOrders = await loader.purchaseOrders();
  const count: number = po.length;
  assertEquals(count, 13);
  const amount: Amount = (await loader.amount()) / count;
  po.forEach((p) => assertEquals(p.amount, amount));
});

Deno.test("Positions", async () => {
  const loader = new Loader(assets);
  const positions: Positions = await loader.positions();
  assertEquals(positions.length, 20);
});

Deno.test("Settings", async () => {
  const loader = new Loader(assets);
  const settings: Parameters = await loader.settings();
  assert("weekday" in settings);
});
