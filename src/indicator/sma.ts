/** Calculates the Simple Moving Average (SMA) of a given array of numbers.
 * @param {number[]} data - The array of numbers to calculate the SMA for.
 * @param {number} period - The period over which to calculate the SMA.
 * @returns {number[]} The array of SMA values.
 */
export function SMA(data: number[], period: number): number[] {
  if (data.length < period) {
    throw new Error("Insufficient data to calculate SMA.");
  }
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    sma.push(sum / period);
  }
  return sma;
}
