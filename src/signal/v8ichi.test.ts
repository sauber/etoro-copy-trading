import { createTestInstrument, Series } from "@sauber/backtest";
import { limits, signal as v8ichi } from "./v8ichi.ts";
import { assert } from "@std/assert";
import { linechart } from "@sauber/widgets";

Deno.test("V8 Ichi Signal", () => {
  // Test chart
  const chart = createTestInstrument(400);
  console.log(linechart(Array.from(chart.series), 11, 72));

  // Generate signals from chart
  // const values = {
  //   ewo_high: limits.ewo_high.default,
  //   ewo_low: limits.ewo_low.default,
  //   rsi_buy: limits.rsi_buy.default,
  //   rsi_sell: limits.rsi_sell.default,
  // };

  const optimized = {
    "ewo_high": 7.64,
    "ewo_low": -0.601,
    "rsi_buy": 19,
    "rsi_sell": 71,
    "ma_buy_period": 14,
    "ma_sell_period": 87,
    "hma_period": 62,
    "ewo_fast_period": 2,
    "ewo_slow_period": 61,
    "rsi_fast_period": 9,
    "rsi_period": 13,
    "rsi_slow_period": 26,
  };

  const signals: Series = v8ichi(chart.series, optimized);

  console.log(linechart(Array.from(signals), 11, 72));
  console.log(signals.filter((v) => v < 0));

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
  assert(Object.keys(limits).length > 0, "Expected parameters");

  // Check each parameter
  Object.values(limits).forEach((param) => {
    assert(param.min < param.max, "Minimum value should less than maximum");
  });
});
