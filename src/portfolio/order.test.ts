import { assertEquals, assertInstanceOf } from "@std/assert";
import { investor, position } from "📚/portfolio/testdata.ts";
import { Order } from "📚/portfolio/order.ts";

Deno.test("Instance", () => {
  const o = new Order();
  assertInstanceOf(o, Order);
});

Deno.test("Buy", () => {
  const o = new Order().buy([{
    investor,
    date: investor.chart.start,
    amount: 1000,
  }]);

  assertEquals(o.buyItems.length, 1);
});

Deno.test("Sell", () => {
  const o = new Order().sell([{ position, reason: "test" }]);
  assertEquals(o.sellItems.length, 1);
});
