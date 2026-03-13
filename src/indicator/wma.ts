/** Calculates the Weighted Moving Average (WMA) of a given array of numbers.
 * @param {number[]} data - The array of numbers to calculate the WMA for.
 * @param {number} period - The period over which to calculate the WMA.
 * @returns {number[]} The array of WMA values.
 */
export function WMA(data: number[], period: number): number[] {
  if (data.length < period) {
    throw new Error("Insufficient data to calculate WMA.");
  }
  const wma = [];
  const weight = (period * (period + 1)) / 2;
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j] * (period - j);
    }

    wma.push(sum / weight);
  }
  return wma;
}
