import { IntegerParameter, Parameter, Parameters } from "📚/optimize/mod.ts";

type Weekday = number;
type BuyWindow = number;
type BuyThreshold = number;
type SellWindow = number;
type SellThreshold = number;
type PositionSize = number;
type StopLoss = number;
type Limit = number;

/** Parameters to strategies */
export type ParameterData = {
  weekday: Weekday;
  buy_window: BuyWindow;
  buy_threshold: BuyThreshold;
  sell_window: SellWindow;
  sell_threshold: SellThreshold;
  position_size: PositionSize;
  stoploss: StopLoss;
  limit: Limit;
};

/** Default parameter values */
export const default_parameters: ParameterData = {
  weekday: 1,
  buy_window: 14,
  buy_threshold: 30,
  sell_window: 21,
  sell_threshold: 70,
  position_size: 0.1,
  stoploss: 0.85,
  limit: 1
};

/** Only the values in sequence */
export type ParameterValues = [
  Weekday,
  BuyWindow,
  BuyThreshold,
  SellWindow,
  SellThreshold,
  PositionSize,
  StopLoss,
  Limit
];

/** Generate list of parameters optionally with initial values */
export function makeParameters(value: ParameterValues | [] = []): Parameters {
  return [
    new IntegerParameter("buy_window", 3, 100, value[0]),
    new IntegerParameter("buy_threshold", 10, 40, value[1]),
    new IntegerParameter("sell_window", 3, 100, value[2]),
    new IntegerParameter("sell_threshold", 60, 90, value[3]),
    new IntegerParameter("weekday", 1, 1, value[4]),
    new Parameter("position_size", 0.01, 0.05, value[5]),
    new Parameter("stoploss", 0.85, 0.95, value[6]),
    new IntegerParameter("limit", 1, 10, value[7])
  ];
}
