import { assertAlmostEquals, assertEquals, assertGreater, assertThrows } from "@std/assert";
import { Simulation } from "@sauber/backtest";
import { score } from "./score.ts";

// Helper to create a mock simulation object for testing
function mockSimulation(
  data: Partial<{
    trades: number;
    profit: number;
    winRatio: number;
    fragility: number;
    bars: number;
    closeRatio: number;
  }>,
): Simulation {
  return {
    account: {
      trades: Array(data.trades ?? 0),
      profit: data.profit ?? 0,
      WinRatioTrades: data.winRatio ?? 1,
      fragility: data.fragility ?? 0,
      bars: data.bars ?? 1000,
      closeRatio: data.closeRatio ?? 1,
    },
  } as unknown as Simulation;
}

Deno.test("score() returns 0 if there are no trades", () => {
  const simulation = mockSimulation({ trades: 0 });
  assertEquals(score(simulation), 0);
});

Deno.test("score() calculates correctly for a profitable simulation", () => {
  const simulation = mockSimulation({
    trades: 10,
    profit: 100,
    winRatio: 0.8,
    fragility: 0.1,
    bars: 1000,
    closeRatio: 0.9,
  });
  // trades_cost = tanh(10 / 1000) = 0.009999...
  // lose_cost = 1 - 0.8 = 0.2
  // frag = 0.1
  // abrupt = 1 - 0.9 = 0.1
  // scale = 100
  // costs = 100 * (0.009999... + 0.2 + 0.1 + 0.1) / 4 = 10.25...
  // result = 100 - 10.25... = 89.75...
  assertAlmostEquals(score(simulation), 89.75);
});

Deno.test("score() calculates correctly for a losing simulation", () => {
  const simulation = mockSimulation({
    trades: 10,
    profit: -100,
    winRatio: 0.2,
    fragility: 0.8,
    bars: 1000,
    closeRatio: 0.5,
  });
  // trades_cost = tanh(0.01) = 0.009999...
  // lose_cost = 1 - 0.2 = 0.8
  // frag = 0.8
  // abrupt = 1 - 0.5 = 0.5
  // scale = 100
  // costs = 100 * (0.009999... + 0.8 + 0.8 + 0.5) / 4 = 52.75...
  // result = -100 - 52.75... = -152.75...
  assertAlmostEquals(score(simulation), -152.75);
});

Deno.test("score() penalizes for a higher number of trades", () => {
  const base = { profit: 100, bars: 1000 };
  const lowTradesSim = mockSimulation({ ...base, trades: 10 });
  const highTradesSim = mockSimulation({ ...base, trades: 500 });
  assertGreater(score(lowTradesSim), score(highTradesSim));
});

Deno.test("score() penalizes for a lower win ratio", () => {
  const base = { trades: 10, profit: 100 };
  const highWinSim = mockSimulation({ ...base, winRatio: 0.9 });
  const lowWinSim = mockSimulation({ ...base, winRatio: 0.1 });
  assertGreater(score(highWinSim), score(lowWinSim));
});

Deno.test("score() penalizes for higher fragility", () => {
  const base = { trades: 10, profit: 100 };
  const lowFragilitySim = mockSimulation({ ...base, fragility: 0.1 });
  const highFragilitySim = mockSimulation({ ...base, fragility: 0.9 });
  assertGreater(score(lowFragilitySim), score(highFragilitySim));
});

Deno.test("score() penalizes for a lower close ratio", () => {
  const base = { trades: 10, profit: 100 };
  const highCloseRatioSim = mockSimulation({ ...base, closeRatio: 0.9 });
  const lowCloseRatioSim = mockSimulation({ ...base, closeRatio: 0.1 });
  assertGreater(score(highCloseRatioSim), score(lowCloseRatioSim));
});

Deno.test("score() throws an error for an invalid (NaN) result", () => {
  const simulation = mockSimulation({
    trades: 10,
    profit: NaN,
  });
  assertThrows(() => score(simulation), Error, "Score is invalid");
});