import { RSI } from "@debut/indicators";
import { Series } from "@sauber/backtest";
import { IntegerParameter } from "@sauber/optimize";

/** Required input to signal function */
export type Parameters = [
  IntegerParameter,
  IntegerParameter,
  IntegerParameter,
  IntegerParameter,
];

/** List of parameters used by signal and default values */
export const parameters = (): Parameters => [
  new IntegerParameter("buy_window", 1, 50, 14),
  new IntegerParameter("buy_threshold", 1, 49, 3),
  new IntegerParameter("sell_window", 1, 50, 20),
  new IntegerParameter("sell_threshold", 51, 99, 80),
];

/** Generate parameters from custom values */
export const makeParameters = (
  buy_window: number,
  buy_threshold: number,
  sell_window: number,
  sell_threshold: number,
): Parameters => [
  new IntegerParameter("buy_window", 1, 50, buy_window),
  new IntegerParameter("buy_threshold", 1, 49, buy_threshold),
  new IntegerParameter("sell_window", 1, 50, sell_window),
  new IntegerParameter("sell_threshold", 51, 99, sell_threshold),
];

/** Create a series of signals in range [-1,1] based on RSI indicator of value chart */
export function rsi(source: Series, values: Parameters): Series {
  const [buy_window, buy_threshold, sell_window, sell_threshold] = values.map((
    v,
  ) => v.value);

  const buy_indicator = new RSI(buy_window);
  const buy_series: Series = source.map((v) => buy_indicator.nextValue(v));
  const sell_indicator = new RSI(sell_window);
  const sell_series: Series = source.map((v) => sell_indicator.nextValue(v));

  const signal: Series = buy_series.map((buy_value, index) => {
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
