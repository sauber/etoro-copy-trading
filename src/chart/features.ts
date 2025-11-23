import { Series } from "@sauber/backtest";
import { Investors } from "../community/mod.ts";
import { Investor } from "../investor/mod.ts";
import { sharpe_ratio } from "../ranking/sharperatio.ts";

export type Input = Series;
export type Output = number;
export type Sample = [Input, Output];
export type Samples = Sample[];

/** From investor charts, extract past bars and future sharpe ratio */
export class Features {
  // Number of bars used for training data
  private readonly required_bars: number;

  // Investors having sufficient data
  private readonly investors: Investors;

  constructor(
    // Pool of investors
    investors: Investors,
    // Count of bars for input
    private readonly past_bars: number,
    // Count of bars of calculating output score
    private readonly future_bars: number,
    // Count of bars between input and output window
    private readonly gap_bars: number,
  ) {
    // Select investors having sufficent chart bars available
    this.required_bars = past_bars + future_bars + gap_bars;
    this.investors = investors.filter((i: Investor) =>
      i.length >= this.required_bars
    );
  }

  /** From one random investor pick a random period and generate input and output training data */
  private sample(): Sample {
    // Choose random investor
    const index = Math.floor(Math.random() * this.investors.length);
    const investor: Investor = this.investors[index];
    const series: Series = investor.series;
    const available_bars: number = series.length;

    // Pick a random point in chart for training data
    const input_offset: number = Math.floor(
      (available_bars - this.required_bars) * Math.random(),
    );
    const output_offset: number = input_offset + this.past_bars + this.gap_bars;

    // Pick section of chart for input and output
    const input: Input = series.slice(
      input_offset,
      input_offset + this.past_bars,
    );
    const future: Series = series.slice(
      output_offset,
      output_offset + this.future_bars,
    );

    // Calculate score
    // TODO: Externalize to other module
    // TODO: Instead find max peak minus max drawdown until peak
    const sr: Output = sharpe_ratio(future, 0.05);

    // Valid result or try again?
    if (isFinite(sr)) return [input, sr];
    return this.sample();
  }

  public samples(count: number): Samples {
    const samples: Samples = Array.from(
      Array.from({ length: count }).map(() => this.sample()),
    );
    // console.log({ samples });
    return samples;
  }
}
