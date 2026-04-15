import { assertEquals } from "@std/assert";
import { Backtest, ClosedPosition } from "@sauber/backtest";
import { score } from "./score.ts";

// Helper to create a mock simulation object for testing
function mockSimulation(
  data: Partial<{
    transactions: ClosedPosition[];
  }> = {},
): Backtest {
  return {
    transactions: data.transactions ?? [],
  } as unknown as Backtest;
}

Deno.test("score() returns 0 if there are no trades", () => {
  const simulation = mockSimulation();
  assertEquals(score(simulation), 0);
});
