import { createTestInstrument, Series } from "@sauber/backtest";
import { parameters, stochastic } from "./stochastic.ts";
import { assert } from "@std/assert";
import { IntegerParameter } from "@sauber/optimize";

Deno.test("Stochastic Oscillator Signal", () => {
  // Test chart
  const chart = createTestInstrument(70);

  // Generate signals from chart
  const [window, smoothing, buy, sell] = parameters();
  const signals: Series = stochastic(chart.series, [
    window,
    smoothing,
    buy,
    sell,
  ]);

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
  assert(parameters().length === 4, "Expected 4 parameters");

  // Check each parameter
  parameters().forEach((param) => {
    assert(param instanceof IntegerParameter, "Expected IntegerParameter");
    assert(param.min >= 1, "Minimum value should be at least 1");
    assert(param.max <= 100, "Maximum value should not exceed 100");
  });
});
