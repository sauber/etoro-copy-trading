import { NullStrategy } from "📚/timing/strategy.ts";
import { assertEquals, assertInstanceOf } from "@std/assert";
import { StrategyContext } from "@sauber/backtest";

Deno.test("Do nothing strategy", () => {
  const strategy = new NullStrategy();
  assertInstanceOf(strategy, NullStrategy);
  const context: StrategyContext = {
    bar: 0,
    value: 0,
    amount: 0,
    instruments: [],
    positions: [],
  };
  assertEquals(strategy.open(context), []);
  assertEquals(strategy.close(context), []);
});
