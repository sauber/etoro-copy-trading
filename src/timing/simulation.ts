import type { Chart } from "📚/chart/mod.ts";
import type { Strategy } from "📚/timing/strategy.ts";
import { nextDate } from "📚/time/mod.ts";

/** Apply a strategy to a chart */
export function simulation(chart: Chart, strategy: Strategy): number {
  let price: number | undefined;
  let gain: number = 1;

  for (let date = strategy.start; date <= strategy.end; date = nextDate(date)) {
    const signal = strategy.signal(date);
    // Sell signal
    if (price && signal < 0) {
      gain *= chart.value(date) / price;
      console.log({gain});
      price = undefined;
    } // Buy signal
    else if (signal > 0) {
      price = chart.value(date);
    }
  }
  return gain;
}
