import { IntegerParameter, Parameter, Parameters } from "📚/optimize/mod.ts";

type Weekday = number;
type BuyWindow = number;
type BuyThreshold = number;
type SellWindow = number;
type SellThreshold = number;
type PositionSize = number;

/** Parameters to strategies */
export type ParameterData = {
  weekday: Weekday;
  buy_window: BuyWindow;
  buy_threshold: BuyThreshold;
  sell_window: SellWindow;
  sell_threshold: SellThreshold;
  position_size: PositionSize;
};

/** Default parameter values */
export const default_parameters: ParameterData = {
  weekday: 1,
  buy_window: 14,
  buy_threshold: 30,
  sell_window: 21,
  sell_threshold: 70,
  position_size: 0.1,
};

/** Only the values in sequence */
export type ParameterValues = [
  Weekday,
  BuyWindow,
  BuyThreshold,
  SellWindow,
  SellThreshold,
  PositionSize,
];

/** Generate list of parameters optionally with initial values */
export function makeParameters(value: ParameterValues | [] = []): Parameters {
  return [
    new IntegerParameter("buy_window", 2, 100, value[0]),
    new IntegerParameter("buy_threshold", 5, 50, value[1]),
    new IntegerParameter("sell_window", 2, 100, value[2]),
    new IntegerParameter("sell_threshold", 50, 95, value[3]),
    new IntegerParameter("weekday", 1, 1, value[4]),
    new Parameter("position_size", 0.01, 0.1, value[5]),
  ];
}
