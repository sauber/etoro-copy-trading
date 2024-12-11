import {
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import { Context } from "./context.ts";
import { assets } from "📚/trading/testdata.ts";
import {
  Amount,
  Positions,
  PurchaseOrders,
  StrategyContext,
} from "@sauber/backtest";
import { diffDate, today } from "📚/time/mod.ts";
import { Mirror } from "📚/repository/mod.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Context(assets), Context);
});

Deno.test("Trading Day", async () => {
  const loader = new Context(assets);
  const data: StrategyContext = await loader.load();
  assertEquals(data.bar, diffDate("2022-04-25", today()));
});

Deno.test("Value", async () => {
  const loader = new Context(assets);
  const data: StrategyContext = await loader.load();
  assertEquals(
    data.value,
    (await assets.config.get("account") as Mirror).Value,
  );
});

Deno.test("Amount", async () => {
  const loader = new Context(assets);
  const data: StrategyContext = await loader.load();
  const amount: Amount = data.amount;
  assertAlmostEquals(amount, 12.5);
});

Deno.test("Purchase Orders", async () => {
  const loader = new Context(assets);
  const data: StrategyContext = await loader.load();
  const po: PurchaseOrders = data.purchaseorders;
  const count: number = po.length;
  assertEquals(count, 13);
  const amount: Amount = data.amount / count;
  po.forEach((p) => assertEquals(p.amount, amount));
});

Deno.test("Positions", async () => {
  const loader = new Context(assets);
  const data: StrategyContext = await loader.load();
  const positions: Positions = data.positions;
  assertEquals(positions.length, 20);
});
