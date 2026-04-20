import { Series } from "@sauber/backtest";

/**
 * Calculates the Elliott Wave Oscillator using EMA.
 * * @param prices - Series of input prices
 * @param shortPeriod - The short EMA period (default: 5)
 * @param longPeriod - The long EMA period (default: 34)
 * @returns Series containing the EWO values
 */
export const EWO = (
  prices: Series | number[],
  shortPeriod: number = 5,
  longPeriod: number = 34,
): Series | number[] => {
  const kShort: number = 2 / (shortPeriod + 1);
  const kLong: number = 2 / (longPeriod + 1);

  // Initialize EMAs with the first price point
  let emaShort: number = prices[0];
  let emaLong: number = prices[0];

  return prices.map((currentPrice: number, i: number) => {
    // Update Exponential Moving Averages
    emaShort = (currentPrice - emaShort) * kShort + emaShort;
    emaLong = (currentPrice - emaLong) * kLong + emaLong;

    return (i < longPeriod - 1) ? NaN : emaShort - emaLong;
  });
};
