/**
 * Calculates the Exponential Moving Average (EMA).
 * * @param prices - Float32Array of input prices
 * @param period - The lookback period (e.g., 9, 20, 50, 200)
 * @returns Float32Array containing the EMA values
 */
export const EMA = (
  prices: Float32Array,
  period: number,
): Float32Array => {
  const len = prices.length;
  const ema = new Float32Array(len);

  if (len === 0) return ema;

  // EMA Multiplier (Alpha): 2 / (n + 1)
  const k = 2 / (period + 1);

  // Initialize: The first EMA value is usually the first price point
  // or an SMA of the first 'period'. Using prices[0] is the high-perf standard.
  let currentEma = prices[0];

  // We fill the 'warm-up' period with NaN to remain consistent with your EWO/RSI
  ema.fill(NaN, 0, period - 1);

  for (let i = 0; i < len; i++) {
    const price = prices[i];

    // Recursive formula: EMA = (Price - PrevEMA) * k + PrevEMA
    currentEma = (price - currentEma) * k + currentEma;

    if (i >= period - 1) {
      ema[i] = currentEma;
    }
  }

  return ema;
};
