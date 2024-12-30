import { Investor } from "📚/investor/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { diffDate, today } from "📚/time/mod.ts";
import { Features } from "📚/ranking/features.ts";
import { Bar, Chart } from "@sauber/backtest";
import type { Input, Output } from "📚/ranking/types.ts";

// Combine input and output records
type Sample = {
  input: Input;
  output: Output;
};

/** A list of training samples */
export type Samples = Array<Sample>;

/** Prepare data for training models */
export class TrainingData {
  readonly samples: Array<Sample> = [];

  /**
   * @param window - Minimum number of chart values available after date of stats for calculating SharpeRatio
   */
  constructor(private readonly window = 30) {}

  /**
   * Load features and sharperatio for an investor.
   * Use each date of stats being available as different samples.
   */
  public features(investor: Investor): Samples {
    const samples: Samples = [];
    const dates: DateFormat[] = investor.stats.dates;
    // const chart: Chart = investor.chart.trim; TODO


    const chart: Chart = investor.chart;
    const end: Bar = chart.end;

    // Test if each date of where stats are available have
    // enough data available for calculating SharpeRatio
    dates
      .map((date: DateFormat) => diffDate(date, today()))
      .filter((bar: Bar) => end - bar >= this.window)
      .forEach((bar: Bar) => {
        const features: Features = new Features(investor);
        const input: Input = features.input(bar);
        const output: Output = features.output(bar);
        if ( isFinite(output.SharpeRatio)) samples.push({ input, output });
      });

      // TODO: Remove outliers
    return samples;
  }
}
