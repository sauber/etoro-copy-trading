import { assertEquals, assertInstanceOf } from "@std/assert";
import { StrategyContext } from "@sauber/backtest";
import { assets, ranking } from "📚/trading/testdata.ts";
import { Policy } from "📚/trading/policy.ts";
import { Loader } from "📚/trading/loader.ts";

const loader = new Loader(assets);
export const context: StrategyContext = await loader.strategyContext();

Deno.test("Instance", () => {
  assertInstanceOf(new Policy(ranking), Policy);
});

Deno.test("Settings", () => {
  const settings: Partial<Policy> = { window: 14 };
  assertInstanceOf(new Policy(ranking, settings), Policy);
});

Deno.test("PurchaseOrders", () => {
  const strategy = new Policy(ranking, { buy_threshold: 40 });
  const pos = strategy.open(context);
  assertEquals(pos.length, 4);
  // console.log(pos);
  
});
