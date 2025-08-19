import { IntegerParameter } from "@sauber/optimize";
import { Stochastic } from "@debut/indicators";
import { Series } from "@sauber/backtest";

/** %K and %D return type from Indicator */
type KD = {
  k: number;
  d: number;
};

/** Required input to signal function */
export type Parameters = [
  IntegerParameter,
  IntegerParameter,
  IntegerParameter,
  IntegerParameter,
];

/** List of parameters used by signal */
export const parameters = (): Parameters => [
  new IntegerParameter("window", 2, 50, 14),
  new IntegerParameter("smoothing", 1, 49, 3),
  new IntegerParameter("buy", 1, 49, 20),
  new IntegerParameter("sell", 51, 99, 80),
];

/** Generate parameters from custom values */
export const makeParameters = (
  window: number,
  smoothing: number,
  buy: number,
  sell: number,
): Parameters => [
  new IntegerParameter("window", 2, 50, window),
  new IntegerParameter("smoothing", 1, 49, smoothing),
  new IntegerParameter("buy", 1, 49, buy),
  new IntegerParameter("sell", 51, 99, sell),
];

/** Convert series of values to series of signals */
export function stochastic(series: Series, values: Parameters): Series {
  // Confirm all parameters are incluced
  const [window, smoothing, buy, sell] = values.map((v) => v.value);

  // Stochastic Oscillator calculation
  const indicator = new Stochastic(window, smoothing);
  let prev: number;
  const momentum: Array<KD> = Array.from<number>(series).map(
    (close: number) => {
      const high = Math.max(prev, close) || close;
      const low = Math.min(prev, close) || close;
      prev = close;
      return indicator.nextValue(high, low, close);
    },
  );

  // Overbought and oversold levels
  const overbought = sell;
  const oversold = buy;

  // Compress indicator into overbought, oversold range
  const signals = momentum.map((value: KD) => {
    if (!value || !value.k || !value.d) return 0; // Handle undefined values
    const k = value.k;
    const d = value.d;
    if (d > overbought && k < d) {
      // Bring range of overbought to 100 into range of 0 to 1
      return (d - overbought) / (100 - overbought);
    } else if (d < oversold && k > d) {
      // Bring range of oversold to 0 into range of 0 to -1
      return (d - oversold) / oversold;
    }
    return 0;
  });

  return new Float32Array(signals);
}
