import { Series } from "@sauber/backtest";

/** Score a series by potential for upside minus draw down, or potential for drawdown minus upside.
 * 1. Scan through a series, find maximum positive score.
 * 2. Find the minimum value prior to maximum
 * 3. The ratio of maximum and minimum values to start value
 * 4. Subtract min ratio from max ratio.
 * 5. Divide subtracted ratio by the index of maximum value and multiply by 365. This the positive score.
 *
 * Repeat same process for negative score
 * 1. Find minimum value and prior maximum.
 * 2. Subtract maximum ratio from minimum ratio
 * 3. Divide by index of minimum  and multiply by 365. This is the negative score.
 *
 * If absolute value of negative score is higher that positive score, return negative score.
 * Otherwise return positive score.
 */
const minmax_ratio = (series: Series): number => {
  const start = series[0];
  let max_index = 0;
  let min_index = 0;
  let max = start;
  let min = start;
  let prior_max = start;
  let prior_min = start;

  for (let i = 1; i < series.length; i++) {
    const value = series[i];
    if (value > max) {
      max = value;
      max_index = i;
      prior_min = min;
    }
    if (value < min) {
      min = value;
      min_index = i;
      prior_max = max;
    }
  }

  // const max_ratio = (max - start) / start;
  // const prior_min_ratio = (prior_min - start) / start; // A negative number
  // const max_score = max_ratio + prior_min_ratio;
  const max_score = max + prior_min - start - start;

  /** Calculation example
  (max - start) / start + (prior_min - start) / start;
  (max - start) + (prior_min - start);
  max - start + prior_min + start;
  max + prior_min - 2*start;

  (150 - 100)/100 = 0.5;
  (75-100)/100 = -0.25;
  0.5 + -.25 = 0.25

  150+75 - 200 = 25


   */

  // const min_ratio = (min - start) / start; // A negative number
  // const prior_max_ratio = (prior_max - start) / start;
  // const min_score = min_ratio + prior_max_ratio;
  const min_score = min + prior_max - start - start;

  const score = Math.abs(min_score) > Math.abs(max_score)
    ? min_score / start / min_index
    : max_score / start / max_index;

  // console.log({
  //   start,
  //   max,
  //   min,
  //   max_index,
  //   min_index,
  //   prior_max,
  //   prior_min,
  //   max_score,
  //   min_score,
  //   score,
  // });
  // Deno.exit(143);

  // Multiply by 20 use full range from -1 to 1
  return score * 20;
};

// Calculate a score from a series, ie. annualised share ratio
export const score = (series: Series): number => minmax_ratio(series);
