import { RSI } from "@debut/indicators";
import { assert } from "@std/assert";
import { Buffer } from "@sauber/backtest";

/** Create a buffer of signals in range [-1,1] based on RSI indicator of value chart */
export function rsi_signal(
  source: Buffer,
  buy_window: number,
  buy_threshold: number,
  sell_window: number,
  sell_threshold: number,
): Buffer {
  assert(buy_window > 1, `buy_window out of range (1,): ${buy_window}`);
  assert(
    buy_threshold > 0 && buy_threshold <= 50,
    `buy_threshold out of range (1,50]: ${buy_window}`,
  );
  assert(sell_window > 1, `sell_window out of range (1,): ${buy_window}`);
  assert(
    sell_threshold >= 50 && sell_threshold < 100,
    `sell_threshold out of range [50,100): ${buy_window}`,
  );

  const buy_indicator = new RSI(buy_window);
  const buy_series: Buffer = source.map((v) => buy_indicator.nextValue(v))
    .filter(
      (v) => v !== undefined && !isNaN(v),
    );
  const sell_indicator = new RSI(sell_window);
  const sell_series: Buffer = source.map((v) => sell_indicator.nextValue(v))
    .filter(
      (v) => v !== undefined && !isNaN(v),
    );

  const signal: Buffer = buy_series.map((buy_value, index) => {
    if (buy_value < buy_threshold) {
      return (buy_threshold - buy_value) / buy_threshold;
    }
    const sell_value = sell_series[index];
    if (sell_value > sell_threshold) {
      return (sell_threshold - sell_value) / (100 - sell_threshold);
    }
    return 0;
  });

  return signal;
}
