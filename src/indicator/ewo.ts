import { EMA } from "@debut/indicators";

/** Elliot Wave Oscillator */
/**
 * Calculates the Elliott Wave Oscillator (EWO).
 * The EWO is the difference between a fast and a slow Exponential Moving Average (EMA).
 * @param {number[]} data - The array of numbers to calculate the EWO for.
 * @param {number} fastPeriod - The period for the fast EMA. Default is 5.
 * @param {number} slowPeriod - The period for the slow EMA. Default is 35.
 * @returns {number[]} The array of EWO values.
 */
export function EWO(data: number[], fastPeriod = 5, slowPeriod = 35): number[] {
  if (slowPeriod < fastPeriod) {
    throw new Error(
      "Slow period must be greater than or equal to fast period.",
    );
  }
  if (data.length < slowPeriod) {
    throw new Error(
      `Insufficient data to calculate EWO. Needs at least ${slowPeriod} data points.`,
    );
  }

  const emaFastIndicator = new EMA(fastPeriod);
  const emaSlowIndicator = new EMA(slowPeriod);
  const emaFast = data.map((price) => emaFastIndicator.nextValue(price));
  const emaSlow = data.map((price) => emaSlowIndicator.nextValue(price));

  const ewo = [];
  // const fastOffset = slowPeriod - fastPeriod;
  for (let i = 0; i < emaSlow.length; i++) {
    ewo.push(emaFast[i] - emaSlow[i]);
  }

  return ewo;
}
