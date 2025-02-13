import { assertEquals, assertInstanceOf } from "@std/assert";
import { DelayStrategy } from "./delay-strategy.ts";
import {
  CloseOrders,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { PassThroughStrategy } from "📚/strategy/mod.ts";

const other: Strategy = new PassThroughStrategy();

const context: StrategyContext = {
  bar: 0,
  value: 0,
  amount: 0,
  purchaseorders: [],
  closeorders: [],
  positions: []
};

Deno.test("Instance", () => {
  assertInstanceOf(new DelayStrategy(1, other), DelayStrategy);
});

Deno.test("Open", () => {
  const delay: DelayStrategy = new DelayStrategy(1, other);
  const open: PurchaseOrders = delay.open(context);
  assertEquals(context.bar, 0);
  assertEquals(open, []);
});

Deno.test("Close", () => {
  const delay: DelayStrategy = new DelayStrategy(1, other);
  const close: CloseOrders = delay.close(context);
  assertEquals(context.bar, 0);
  assertEquals(close, []);
});
