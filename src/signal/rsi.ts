import { RSI } from "@debut/indicators";
import { Series } from "@sauber/backtest";
import { Limits } from "../optimize/mod.ts";

// Range of parameters
export const inputParameters: Limits = {
  buy_window: { min: 1, max: 50, default: 14, int: true },
  buy: { min: 1, max: 49, default: 3, int: true },
  sell_window: { min: 1, max: 50, default: 20, int: true },
  sell: { min: 51, max: 99, default: 80, int: true },
};

export type Input = Record<keyof typeof inputParameters, number>;

/** Create a series of signals in range [-1,1] based on RSI indicator of value chart */
function rsi(source: Series, values: Input): Series {
  const { buy_window, buy, sell_window, sell } = values;

  const buy_indicator = new RSI(buy_window);
  const buy_series: Series = source.map((v) => buy_indicator.nextValue(v));
  const sell_indicator = new RSI(sell_window);
  const sell_series: Series = source.map((v) => sell_indicator.nextValue(v));

  const signal: Series = buy_series.map((buy_value, index) => {
    if (buy_value < buy) return -(buy - buy_value) / buy;

    const sell_value = sell_series[index];
    if (sell_value > sell) return -(sell - sell_value) / (100 - sell);

    return 0;
  });

  return signal;
}

export { rsi as signal };
