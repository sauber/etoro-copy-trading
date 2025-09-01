import { Stochastic } from "@debut/indicators";
import { Series } from "@sauber/backtest";
import { Limits } from "./indicator.ts";

/** %K and %D return type from Indicator */
type KD = {
  k: number;
  d: number;
};

export const limits: Limits = {
  window: { min: 2, max: 50, default: 14, int: true },
  smoothing: { min: 1, max: 49, default: 3, int: true },
  buy: { min: 1, max: 49, default: 20, int: true },
  sell: { min: 51, max: 99, default: 80, int: true },
};

export type Input = Record<keyof typeof limits, number>;

/** Convert series of values to series of signals */
function stochastic(series: Series, values: Input): Series {
  // Confirm all parameters are incluced
  const { window, smoothing, buy, sell } = values;

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

export { stochastic as signal };
