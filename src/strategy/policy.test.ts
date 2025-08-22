import { assertEquals, assertInstanceOf } from "@std/assert";
import { Policy } from "./policy.ts";
import { context, test_ranking, test_timing } from "./testdata.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Policy(test_ranking, test_timing, 0.1), Policy);
});

Deno.test("Purchase Orders", () => {
  const strategy = new Policy(test_ranking, test_timing, 0.1);
  const pos = strategy.open(context);
  assertEquals(pos.length, 1);
});

Deno.test("Close Orders", () => {
  const strategy = new Policy(test_ranking, test_timing, 0.1);
  const cos = strategy.close(context);
  assertEquals(cos.length, 13);
});
