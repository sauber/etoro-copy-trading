/** Generate list of parameters optionally with initial values */
// export function makeParameters(value: ParameterValues | [] = []): Parameters {
//   return [
//     new IntegerParameter("weekday", 1, 5, value[0]),
//     new IntegerParameter("smoothing", 3, 30, value[1]),
//     new IntegerParameter("buy_threshold", 5, 45, value[2]),
//     new IntegerParameter("sell_threshold", 55, 95, value[3]),
//     new Parameter("position_size", 0.01, 0.07, value[4]),
//     new Parameter("stoploss", 0.05, 0.95, value[5]),
//     new IntegerParameter("limit", 1, 5, value[6]),
//   ];
// }

import { Series } from "@sauber/dataframe";
import { Parameters } from "@sauber/optimize";

export abstract class Signal {
  /** Get the parameters for the signal.
   * @returns The parameters used by the signal.
   */
  abstract get parameters(): Parameters;

  /** Create a series of signals in range [-1,1] based on the given series.
   * @param series - The input series to generate signals from.
   * @returns A series of signals in range [-1, 1] where -1 is strong buy, 0 is neutral, and 1 is strong sell.
   */
  abstract get(series: Series): Series;
}
