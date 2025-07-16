import { Series } from "@sauber/backtest";
import { Parameters } from "@sauber/optimize";

export interface Signal {
  /** Create a series of signals in range [-1,1] based on the given series.
   * @param series - The input series to generate signals from.
   * @returns A series of signals in range [-1, 1] where -1 is strong buy, 0 is neutral, and 1 is strong sell.
   */
  get(series: Series): Series;

  /** List of parameters used by the signal */
  parameters: Parameters;
}
