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
  buy_threshold: number,
  sell_threshold: number,
): Buffer {
  const ema = new EMA(window);
  const ema_series: Buffer = source.map((v) => ema.nextValue(v))
    .filter(
      (v) => v !== undefined && !isNaN(v),
    );

  let previous_streak: number = 0;
  let current_streak: number = 0;
  let max_streak: number = 0;
  const signal: Buffer = ema_series.map((_, index) => {
    if (index === 0) return 0;
    const diff = ema_series[index] - ema_series[index - 1];
    // Continue same trend
    if (
      (diff >= 0 && current_streak >= 0) || (diff <= 0 && current_streak <= 0)
    ) {
      current_streak += diff;
      if (Math.abs(current_streak) > max_streak) {
        max_streak = Math.abs(current_streak);
      }
    } // Reversal
    else {
      previous_streak = current_streak;
      current_streak = diff;
      if (Math.abs(current_streak) > max_streak) {
        max_streak = Math.abs(current_streak);
      }
    }

    const signal = (-current_streak - previous_streak) / max_streak;

    if (signal > 0) {
      const threshold = (50 - buy_threshold) / 50;
      if (signal > threshold) return signal;
      return 0;
    } else {
      // 50 -> 0
      // 75 -> -0.5
      //100 -> -1
      const threshold = (50 - sell_threshold) / 50;
      if (signal < threshold) return signal;
      return 0;
    }
  });

  return signal;
}
