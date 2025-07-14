import { Series } from "@sauber/backtest";

export abstract class Signal {
  /** Create a series of signals in range [-1,1] based on the given series.
   * @param series - The input series to generate signals from.
   * @returns A series of signals in range [-1, 1] where -1 is strong buy, 0 is neutral, and 1 is strong sell.
   */
  abstract get(series: Series): Series;
}
