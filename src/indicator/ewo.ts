import { EMA } from "@debut/indicators";
import { Series } from "@sauber/backtest";

/** Elliot Wave Oscillator */
/**
 * Calculates the Elliott Wave Oscillator (EWO).
 * The EWO is the difference between a fast and a slow Exponential Moving Average (EMA) relative to price.
 * @param {number[]} data - The array of numbers to calculate the EWO for.
 * @param {number} fastPeriod - The period for the fast EMA. Default is 5.
 * @param {number} slowPeriod - The period for the slow EMA. Default is 35.
 * @returns {number[]} The array of EWO values.
 */
export function EWO(
  data: number[] | Series,
  fastPeriod = 5,
  slowPeriod = 35,
): number[] | Series {
  if (slowPeriod < fastPeriod) {
    throw new Error(
      "Slow period must be greater than or equal to fast period.",
    );
  }
  if (data.length < slowPeriod) {
    throw new Error(
      `Insufficient data to calculate EWO. Needs at least ${slowPeriod} data points, got ${data.length}`,
    );
  }

  // EMA fast and slow indicators
  const fast = new EMA(fastPeriod);
  const slow = new EMA(slowPeriod);

  // return ewo;
  return data.map((price) => (fast.nextValue(price) - slow.nextValue(price))// / price * 100
  );
}
