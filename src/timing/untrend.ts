import { Buffer } from "@sauber/backtest";
import { avg } from "@sauber/statistics";

/**
 * Removes exponential trend from a buffer of values.
 * @param input Buffer of positive numbers.
 * @returns Buffer with exponential trend removed.
 */
export function detrendExponential(input: Buffer): Buffer {
  // Step 1: Take log of all values
  const logVals: Buffer = input.map((v) => Math.log(v));

  // Step 2: Linear regression on logVals
  const n = logVals.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += logVals[i];
    sumXY += i * logVals[i];
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Step 3: Calculate the average line
  const middle = avg(Array.from(input));

  // Step 4: Subtract difference between original and trend from original
  const output: Buffer = input.map((value, index) => {
    const trendValue = Math.exp(intercept + slope * index);
    const results = middle + value - trendValue;
    // console.log(`Index: ${index}, Value: ${value}, Trend Value: ${trendValue}, Results: ${results}`);
    return results;
  });

  return output;
}
