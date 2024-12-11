import { assertEquals, assertInstanceOf } from "@std/assert";
import { StrategyContext } from "@sauber/backtest";
import { RSIStrategy } from "📚/technical/rsi-strategy.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new RSIStrategy(), RSIStrategy);
});

Deno.test("Open/Close", () => {
  const strategy = new RSIStrategy();
  const context: StrategyContext = {
    bar: 0,
    value: 0,
    amount: 0,
    purchaseorders: [],
    positions: [],
  };
  assertEquals(strategy.open(context), []);
  assertEquals(strategy.close(context), []);
});
