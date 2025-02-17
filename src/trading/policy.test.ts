import { assertEquals, assertInstanceOf } from "@std/assert";
import { Policy } from "📚/trading/policy.ts";
import { context, test_ranking, test_timing } from "📚/trading/testdata.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Policy(test_ranking, test_timing, 0.1), Policy);
});

Deno.test("Purchase Orders", () => {
  const strategy = new Policy(test_ranking, test_timing, 0.1);
  const pos = strategy.open(context);
  // pos.forEach(p=>console.log(p.instrument.symbol, p.amount));
  assertEquals(pos.length, 1);
});

Deno.test("Close Orders", () => {
  const strategy = new Policy(test_ranking, test_timing, 0.1);
  const cos = strategy.close(context);
  // cos.forEach(p=>console.log(p.position.instrument.symbol, p.position.amount));
  assertEquals(cos.length, 13);
});
