import { Series } from "@sauber/backtest";
import { avg } from "@sauber/statistics";

/**
 * Removes exponential trend from a series of values.
 * @param input Series of positive numbers.
 * @returns Series with exponential trend removed.
 */
export function detrendExponential(input: Series): Series {
  // Step 1: Take log of all values
  const logVals: Series = input.map((v) => Math.log(v));

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
  const output: Series = input.map((value, index) => {
    const trendValue = Math.exp(intercept + slope * index);
    return value - trendValue;
  });

  // Step 4: Calculate the average base line
  const base = Math.max(
    avg(Array.from(input)),
    -Math.min(...Array.from(adjust)),
  );

  // Step 5: Lift gap line to center around base line
  const output: Buffer = adjust.map((value) => base + value);

  // Step 6: Confirm all values are positive
  for (let i = 0; i < output.length; i++) {
    if (output[i] < 0) {
      throw new Error(
        `Detrended value at index ${i} is negative: ${
          output[i]
        }. Input values must be positive. Input=${input[i]}, Adjust=${
          adjust[i]
        }, Base=${base}.`,
      );
    }
  }

  // Step 7: Return the adjusted buffer
  return output;
}
