import { EMA } from "@debut/indicators";
import { Buffer } from "@sauber/backtest";

/**
 * Create a buffer of signals in range [-1,1] based on demark style indicator.
 * Take ema of prices.
 * Find longest continues streak of higher highs and lower lows.
 * Calculate previous continuous streak as a ratio of longest streak.
 * Find number of bars since previous continuous streak.
 * Signal strength is ratio of previous streak to largest streak divided by number of bars since previous streak.
 */
export function demark_signal(
  source: Buffer,
  window: number,
): Buffer {
  const ema = new EMA(window);
  const ema_series: Buffer = source.map((v) => ema.nextValue(v))
    .filter(
      (v) => v !== undefined && !isNaN(v),
    );

  let streak: number = 0;
  let max: number = 0;
  let bars: number = 0;
  const signal: Buffer = ema_series.map((_, index) => {
    if (index === 0) return 0;
    const diff = ema_series[index] - ema_series[index - 1];
    // Continue same trend
    if ((diff >= 0 && streak >= 0) || (diff <= 0 && streak <= 0)) {
      streak += diff;
      bars++;
    } 
    // Reversal
    else {
      streak = diff;
      bars = 1;
    }
    // Track max streak size
    if (Math.abs(streak) > max) max = Math.abs(streak);

    const signal: number = -streak / max / bars;
    return signal;
  });

  return signal;
}
