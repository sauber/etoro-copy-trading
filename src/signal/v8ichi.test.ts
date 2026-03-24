import { createTestInstrument, Series } from "@sauber/backtest";
import { limits, signal as v8ichi } from "./v8ichi.ts";
import { assert } from "@std/assert";
import { linechart } from "@sauber/widgets";

Deno.test("V8 Ichi Signal", () => {
  // Test chart
  const chart = createTestInstrument(600);
  console.log(linechart(Array.from(chart.series), 15, 72));

  // Generate signals from chart
  const values = {
    low_offset: limits.low_offset.default,
    ewo_high: limits.ewo_high.default,
    ewo_low: limits.ewo_low.default,
    rsi_buy: limits.rsi_buy.default,
    rsi_sell: limits.rsi_sell.default,
  };

  const signals: Series = v8ichi(chart.series, values);

  console.log(linechart(Array.from(signals), 15, 72));

  // Confirm signal values are in range [-1, 1]
  signals.forEach((value, index) =>
    assert(
      value >= -1 && value <= 1,
      `Signal out of range at index ${index}: ${value}`,
    )
  );
});

Deno.test("V8 Ichi Parameters", () => {
  // Test parameters
  assert(Object.keys(limits).length === 5, "Expected 4 parameters");

  // Check each parameter
  Object.values(limits).forEach((param) => {
    assert(param.min < param.max, "Minimum value should less than maximum");
  });
});
