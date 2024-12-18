import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import {
  Amount,
  Bar,
  CloseOrders,
  PurchaseOrders,
  StrategyContext,
} from "@sauber/backtest";
import { DateFormat, diffDate, today } from "📚/time/mod.ts";
import { Mirror } from "📚/repository/mod.ts";
import { Loader } from "📚/trading/loader.ts";
import { assets } from "📚/trading/testdata.ts";
import { Parameters } from "📚/trading/trading-strategy.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Loader(assets), Loader);
});

Deno.test("Username", async () => {
  const loader = new Loader(assets);
  const username: string = await loader.username();
  assertEquals(
    username,
    (await assets.config.get("account") as Mirror).UserName,
  );
});

Deno.test("Trading Day", async () => {
  const loader = new Loader(assets);
  const bar: Bar = await loader.tradingBar();
  assertEquals(bar, diffDate("2022-04-25", today()));

  const date: DateFormat = await loader.tradingDate();
  assertEquals(date, "2022-04-25");
});

Deno.test("Trading Context", async () => {
  const loader = new Loader(assets);
  const context: StrategyContext = await loader.strategyContext();
  const value: Amount = (await assets.config.get("account") as Mirror).Value;
  assertEquals(context.value, value);
  assertAlmostEquals(context.amount, 12.5);

  // Purchase Orders
  const po: PurchaseOrders = context.purchaseorders;
  assertEquals(po.length, 13);
  po.forEach((p) => assertEquals(p.amount, context.amount / po.length));

  // Close Orders
  const co: CloseOrders = context.closeorders;
  assertEquals(co.length, 20);
  co.forEach((c) => assertEquals(c.confidence, 1));
});

Deno.test("Settings", async () => {
  const loader = new Loader(assets);
  const settings: Parameters = await loader.settings();
  assert("weekday" in settings);
});
