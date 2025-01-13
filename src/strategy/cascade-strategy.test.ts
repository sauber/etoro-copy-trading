import { assertEquals, assertInstanceOf } from "@std/assert";
import { Strategy, StrategyContext } from "@sauber/backtest";
import { CascadeStrategy } from "📚/strategy/cascade-strategy.ts";
import { PassThroughStrategy } from "📚/strategy/pass-through-strategy.ts";
import { NullStrategy } from "📚/strategy/null-strategy.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new CascadeStrategy([]), CascadeStrategy);
});

Deno.test("List of Strategies", () => {
  const strategies: Strategy[] = [
    new PassThroughStrategy(),
    new NullStrategy(),
  ];
  const cascade: CascadeStrategy = new CascadeStrategy(strategies);

  const context: StrategyContext = {
    bar: 0,
    value: 0,
    amount: 0,
    purchaseorders: [],
    closeorders: [],
  };
  assertEquals(cascade.open(context), []);
  assertEquals(cascade.close(context), []);
});
