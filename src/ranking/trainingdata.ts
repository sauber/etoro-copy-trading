import { Investor } from "📚/investor/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { diffDate } from "📚/time/mod.ts";
import { Features } from "📚/ranking/features.ts";
import { Chart } from "📚/chart/mod.ts";
import type { Input, Output } from "./types.ts";

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
    const chart: Chart = investor.chart.trim;
    const end: DateFormat = chart.end;

    // Test if each date of where stats are available have
    // enough data available for calculating SharpeRatio
    dates
      .filter((date: DateFormat) => diffDate(date, end) >= this.window)
      .forEach((date: DateFormat) => {
        const features: Features = new Features(investor);
        const input: Input = features.input(date);
        const output: Output = features.output(date);
        samples.push({ input, output });
      });

    return samples;
  }
}
