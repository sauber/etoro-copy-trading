import { SMA } from "./sma.ts";

/** Elliot Wave Oscillator */
/**
 * Calculates the Elliott Wave Oscillator (EWO).
 * The EWO is the difference between a fast and a slow Simple Moving Average (SMA).
 * @param {number[]} data - The array of numbers to calculate the EWO for.
 * @param {number} fastPeriod - The period for the fast SMA. Default is 5.
 * @param {number} slowPeriod - The period for the slow SMA. Default is 35.
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

  const smaFast = SMA(data, fastPeriod);
  const smaSlow = SMA(data, slowPeriod);

  const ewo = [];
  const fastOffset = slowPeriod - fastPeriod;
  for (let i = 0; i < smaSlow.length; i++) {
    ewo.push(smaFast[i + fastOffset] - smaSlow[i]);
  }
  return ewo;
}
