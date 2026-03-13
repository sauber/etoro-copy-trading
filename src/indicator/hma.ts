import { WMA } from "./wma.ts";

/** Calculates the Hull Moving Average (HMA) of a given array of numbers.
 * @param {number[]} data - The array of numbers to calculate the HMA for.
 * @param {number} period - The period over which to calculate the HMA.
 * @returns {number[]} The array of HMA values.
 */
export function HMA(data: number[], period: number): number[] {
  if (data.length < period) {
    throw new Error("Insufficient data to calculate HMA.");
  }
  const halfPeriod = Math.floor(period / 2);
  const sqrtPeriod = Math.floor(Math.sqrt(period));

  const wmaFull = WMA(data, period);
  const wmaHalf = WMA(data, halfPeriod);

  const rawHMA = [];
  const offset = period - halfPeriod;
  for (let i = 0; i < wmaFull.length; i++) {
    rawHMA.push(2 * wmaHalf[i + offset] - wmaFull[i]);
  }

  return WMA(rawHMA, sqrtPeriod);
}
