import { IntegerParameter, Parameter, Parameters } from "@sauber/optimize";

type Window = number;
type Weekday = number;
type Smoothing = number;
type BuyThreshold = number;
type SellThreshold = number;
type PositionSize = number;
type StopLoss = number;
type Limit = number;

/** Parameters to strategies */
export type ParameterData = {
  window: Window;
  weekday: Weekday;
  smoothing: Smoothing;
  buy_threshold: BuyThreshold;
  sell_threshold: SellThreshold;
  position_size: PositionSize;
  stoploss: StopLoss;
  limit: Limit;
};

/** Default parameter values */
export const default_parameters: ParameterData = {
  window: 14,
  weekday: 1,
  smoothing: 14,
  buy_threshold: 30,
  sell_threshold: 70,
  position_size: 0.1,
  stoploss: 0.85,
  limit: 1,
};

/** Only the values in sequence */
export type ParameterValues = [
  Window,
  Weekday,
  Smoothing,
  BuyThreshold,
  SellThreshold,
  PositionSize,
  StopLoss,
  Limit,
];

/** Generate list of parameters optionally with initial values */
export function makeParameters(value: ParameterValues | [] = []): Parameters {
  return [
    new IntegerParameter("window", 2, 50, value[0]),
    new IntegerParameter("weekday", 1, 5, value[1]),
    new IntegerParameter("smoothing", 3, 30, value[2]),
    new IntegerParameter("buy_threshold", 5, 45, value[3]),
    new IntegerParameter("sell_threshold", 55, 95, value[4]),
    new Parameter("position_size", 0.01, 0.07, value[5]),
    new Parameter("stoploss", 0.05, 0.95, value[6]),
    new IntegerParameter("limit", 1, 5, value[7]),
  ];
}
