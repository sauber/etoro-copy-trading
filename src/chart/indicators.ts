import { avg } from "../math/statistics.ts";

/** Simple Moving Average */
export function sma(data: number[], window: number): number[] {
  const offset = window - 1;
  const smaValues: number[] = new Array(data.length - offset);

  for (let i = offset; i < data.length; i++) {
    smaValues[i - offset] = avg(data.slice(i - offset, i + 1));
  }

  return smaValues;
}

/** Exponential Moving Average */
export function ema(data: number[], window: number): number[] {
  const alpha = 2 / (window + 1);
  const emaValues = new Array(data.length).fill(NaN);

  emaValues[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    emaValues[i] = alpha * data[i] + (1 - alpha) * emaValues[i - 1];
  }

  return emaValues;
}

/** Relative Strength Index */
export function rsi(data: number[], windowSize: number): number[] {
  if (data.length < windowSize) {
    throw new Error("Data length must be at least 5 for an RSI window of 5");
  }

  const scale = function (gain: number, loss: number) {
    return (loss == 0) ? 100 : 100 - 100 / (1 + gain / loss);
  };

  // All losses and gains
  const gains = new Array<number>(data.length - 1);
  const losses = new Array<number>(data.length - 1);
  for (let i = 1; i < data.length; i++) {
    const difference: number = data[i] - data[i - 1];
    gains[i - 1] = Math.max(0, difference);
    losses[i - 1] = Math.max(0, -difference);
  }

  // Results
  const rsiValues = new Array<number>(data.length - windowSize);

  // First value
  let averageGain = avg(gains.slice(0, windowSize));
  let averageLoss = avg(losses.slice(0, windowSize));
  rsiValues[0] = scale(averageGain, averageLoss);

  // Successive values
  for (let i = windowSize; i < data.length - 1; i++) {
    averageGain = (averageGain * (windowSize - 1) + gains[i]) / windowSize;
    averageLoss = (averageLoss * (windowSize - 1) + losses[i]) / windowSize;
    rsiValues[i - windowSize + 1] = scale(averageGain, averageLoss);
  }

  return rsiValues;
}
