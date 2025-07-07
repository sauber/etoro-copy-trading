import { Investor } from "📚/investor/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { diffDate, today } from "📚/time/mod.ts";
import { Features } from "📚/ranking/features.ts";
import { Bar, Instrument } from "@sauber/backtest";
import type { Input, Output } from "📚/ranking/types.ts";
import { DataFrame } from "@sauber/dataframe";
import { Investors } from "📚/repository/mod.ts";

// Combine input and output records
type Sample = {
  input: Input;
  output: Output;
};

// Recursively trim training data until no outliers remain
function outlierFilter(data: DataFrame, factor: number = 10): DataFrame {
  const prev: number = data.length;
  data = data.outlier(factor);
  if (data.length != prev) {
    console.log(`Data length trimmed ${prev} to ${data.length}`);
  }
  return (data.length == prev) ? data : outlierFilter(data, factor);
}


/** A list of training samples */
export type Samples = Array<Sample>;

/** Prepare data for training models for a since*/
export class TrainingData {
  readonly samples: Array<Sample> = [];

  /**
   * @param window - Minimum number of chart values available after date of stats for calculating future score
   */
  constructor(private readonly window = 30) {}

  /**
   * Load input features and output score for an investor.
   * Use each date of stats being available as different samples.
   */
  private features(investor: Investor): Samples {
    const samples: Samples = [];
    const dates: DateFormat[] = investor.stats.dates;

    const chart: Instrument = investor.chart;
    const end: Bar = chart.end;

    // Test if each date of where stats are available have
    // enough data available for calculating future score
    dates
      .map((date: DateFormat) => diffDate(date, today()))
      .filter((bar: Bar) => bar - end >= this.window)
      .forEach((bar: Bar) => {
        const features: Features = new Features(investor);
        const input: Input = features.input(bar);
        const output: Output = features.output(bar);
        if (isFinite(output)) samples.push({ input, output });
      });

    return samples;
  }

  public generate(investors: Investors): DataFrame {
    const samples: Samples = [];
    for (const investor of investors) {
      const features: Samples = this.features(investor);
      samples.push(...features);
    }

    const records = samples.map((s) =>
      Object.assign(s.input, { Score: s.output })
    );
    const df = DataFrame.fromRecords(records);
    const trimmed = outlierFilter(df);
    return trimmed;
  }
}
