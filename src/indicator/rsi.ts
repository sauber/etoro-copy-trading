/**
 * Calculates the Relative Strength Index (RSI) using Wilder's Smoothing.
 * * @param prices - Float32Array of input prices
 * @param period - The lookback period (standard is 14)
 * @returns Float32Array containing the RSI values
 */
export const RSI = (
  prices: Float32Array,
  period: number = 14,
): Float32Array => {
  const len = prices.length;
  const rsi = new Float32Array(len);

  if (len <= period) {
    rsi.fill(NaN);
    return rsi;
  }

  let avgGain = 0;
  let avgLoss = 0;

  // 1. Initial Seed: Calculate SMA of gains and losses for the first 'period'
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      avgGain += change;
    } else {
      avgLoss -= change;
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Set the first RSI value
  rsi.fill(NaN, 0, period);
  rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  // 2. Wilder's Smoothing Loop
  for (let i = period + 1; i < len; i++) {
    const change = prices[i] - prices[i - 1];
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? -change : 0;

    // Wilder's formula: (Prior Avg * (n-1) + Current) / n
    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }

  return rsi;
};
