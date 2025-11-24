import { Instrument, Instruments, Series } from "@sauber/backtest";
import { score } from "./score.ts";

export type Input = Series;
export type Output = number;
export type Sample = [Input, Output];
export type Samples = Sample[];

/** From investor charts, extract past bars and future sharpe ratio */
export class Features {
  // Number of bars used for training data
  private readonly required_bars: number;

  // Investors having sufficient data
  private readonly instruments: Instruments;

  constructor(
    // Pool of investors
    instruments: Instruments,
    // Count of bars for input
    private readonly past_bars: number,
    // Count of bars of calculating output score
    private readonly future_bars: number,
    // Count of bars between input and output window
    private readonly gap_bars: number,
  ) {
    // Select investors having sufficent chart bars available
    this.required_bars = past_bars + future_bars + gap_bars;
    this.instruments = instruments.filter((i: Instrument) =>
      i.length >= this.required_bars
    );
  }

  /** Cache of extreme scores seens */
  private min_score: number = Infinity;
  private max_score: number = -Infinity;

  private score(series: Series): number {
    const points = score(series);
    if (isFinite(points) && points < this.min_score) {
      this.min_score = points;
      console.log(series);
      console.log("New minimum score:", points);
    }
    if (isFinite(points) && points > this.max_score) {
      this.max_score = points;
      console.log(series);
      console.log("New maximum score:", points);
    }

    return points;
  }

  /** From one random investor pick a random period and generate input and output training data */
  private sample(): Sample {
    // Choose random investor
    const index = Math.floor(Math.random() * this.instruments.length);
    const instrument: Instrument = this.instruments[index];
    const series: Series = instrument.series;
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
    const sr: Output = this.score(future);
    // console.log({ future, sr });

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
