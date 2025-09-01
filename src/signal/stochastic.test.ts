import { createTestInstrument, Series } from "@sauber/backtest";
import { limits, signal as stochastic } from "./stochastic.ts";
import { assert } from "@std/assert";

Deno.test("Stochastic Oscillator Signal", () => {
  // Test chart
  const chart = createTestInstrument(70);

  // Generate signals from chart
  const values = {
    window: limits.window.default,
    smoothing: limits.smoothing.default,
    buy: limits.buy.default,
    sell: limits.sell.default,
  };
  const signals: Series = stochastic(chart.series, values);

  // Confirm signal values are in range [-1, 1]
  signals.forEach((value, index) =>
    assert(
      value >= -1 && value <= 1,
      `Signal out of range at index ${index}: ${value}`,
    )
  );
});

Deno.test("Stochastic Oscillator Parameters", () => {
  // Test parameters
  assert(Object.keys(limits).length === 4, "Expected 4 parameters");

  // Check each parameter
  Object.values(limits).forEach((param) => {
    assert(param.int === true, "Expected IntegerParameter");
    assert(param.min >= 1, "Minimum value should be at least 1");
    assert(param.max <= 100, "Maximum value should not exceed 100");
  });
});