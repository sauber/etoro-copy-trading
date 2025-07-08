import { EMA } from "@debut/indicators";
import { Series } from "@sauber/backtest";

/**
 * Create a series of signals in range [-1,1] based on demark style indicator.
 * Take ema of prices.
 * Find longest continues streak of higher highs and lower lows.
 * Calculate previous continuous streak as a ratio of longest streak.
 * Find number of bars since previous continuous streak.
 * Signal strength is ratio of previous streak to largest streak divided by number of bars since previous streak.
 */
export function demark_signal(
  source: Series,
  window: number,
  buy_threshold: number,
  sell_threshold: number,
): Series {
  const ema = new EMA(window);
  const ema_series: Series = source.map((v) => ema.nextValue(v))
    .filter(
      (v) => v !== undefined && !isNaN(v),
    );

  // When there is a continuous streak of higher highs or lower lows,
  // what is the accumulated change of value?
  // When exceeding the current maximum streak, expand the maximum accordingly.
  // When the trend reverses start a new one.
  let previous_streak: number = 0;
  let current_streak: number = 0;
  let max_streak: number = 0;
  let streak_number: number = 0;
  const signal: Series = ema_series.map((_: number, index: number) => {
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
      streak_number++;
    }

    // Calculate how big the current streak is compared to the previous one.
    // 1 being absolute reversal point, and 0 being as large to or larger than previous
    const reversal: number = 1 -
      Math.min(Math.abs(current_streak) / Math.abs(previous_streak), 1);

    // How big is previous streak compared to maximum?
    const previous_streak_ratio: number = Math.abs(previous_streak) /
      max_streak;

    // Direction of current streak
    const direction: number = current_streak >= 0 ? 1 : -1;

    // Trying to catch a reversal.
    // Signal depend on how big the previous streak was and how small the current is,
    // meaning we are as close after the reversal as possible.
    // And how big was the previous reversal compared to maximum?
    // const signal = (-current_streak - previous_streak) / max_streak;

    const signal: number = previous_streak_ratio * reversal * direction;

    // No signal until we are in third streak, at least
    if (streak_number < 2) return 0;

    if (signal > 0) {
      const threshold = (50 - buy_threshold) / 50;
      if (signal < threshold) 0;
    } else {
      // 50 -> 0
      // 75 -> -0.5
      //100 -> -1
      const threshold = (50 - sell_threshold) / 50;
      if (signal > threshold) return 0;
    }
    // Debugging output
    // const d = (v: number): number => parseFloat(v.toFixed(2));
    // console.log(
    //   streak_number,
    //   index,
    //   d(value),
    //   d(current_streak),
    //   d(previous_streak),
    //   d(max_streak),
    //   d(reversal),
    //   d(previous_streak_ratio),
    //   direction,
    //   d(signal),
    // );

    return signal;
  });

  return signal;
}
