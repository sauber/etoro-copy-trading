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
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { type DateFormat, diffDate, today } from "@sauber/dates";
import { Mirror } from "📚/repository/mod.ts";
import { Loader } from "📚/trading/loader.ts";
import { assets } from "📚/trading/testdata.ts";
import { ParameterData } from "📚/trading/parameters.ts";
import { InvestorRanking } from "📚/ranking/mod.ts";
import { Timing } from "📚/timing/mod.ts";

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
  const settings: ParameterData = await loader.settings();
  assert("weekday" in settings);
});

Deno.test("Ranking Model", async () => {
  const loader = new Loader(assets);
  const model: InvestorRanking = await loader.rankingModel();
  assert(model);
});

Deno.test("Timing Model", async () => {
  const loader = new Loader(assets);
  const model: Timing = await loader.timingModel();
  assert(model);
});

Deno.test("Strategy", async () => {
  const loader = new Loader(assets);
  const strategy: Strategy = await loader.strategy();
  assert(strategy);
});
