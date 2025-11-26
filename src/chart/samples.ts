import { Bar, Instrument, Instruments } from "@sauber/backtest";
import { Features } from "./features.ts";

// export type Outputs = Output[];
// export type TrainingSample = [Input, Output];
// export type Samples = [Inputs, Outputs];

/** Generate a number of samples suitable for training or validation */
export class Samples {
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
  // private min_score: number = Infinity;
  // private max_score: number = -Infinity;

  // private score(series: Series): number {
  //   const points = score(series);
  //   if (isFinite(points) && points < this.min_score) {
  //     this.min_score = points;
  //     // console.log(series);
  //     console.log("New minimum score:", points);
  //   }
  //   if (isFinite(points) && points > this.max_score) {
  //     this.max_score = points;
  //     // console.log(series);
  //     console.log("New maximum score:", points);
  //   }

  //   return points;
  // }

  /** From one random investor pick a random period and generate input and output training data */
  // private sample(): Sample {
  //   // Choose random investor
  //   const index = Math.floor(Math.random() * this.instruments.length);
  //   const instrument: Instrument = this.instruments[index];
  //   const series: Series = instrument.series;
  //   const available_bars: number = series.length;

  //   // Pick a random point in chart for training data
  //   const input_offset: number = Math.floor(
  //     (available_bars - this.required_bars) * Math.random(),
  //   );
  //   const output_offset: number = input_offset + this.past_bars + this.gap_bars;

  //   // Pick section of chart for input and output
  //   const input: Input = series.slice(
  //     input_offset,
  //     input_offset + this.past_bars,
  //   );
  //   const future: Series = series.slice(
  //     output_offset,
  //     output_offset + this.future_bars,
  //   );

  //   // Calculate score
  //   const sr: Output = this.score(future);
  //   // console.log({ future, sr });

  //   // Valid result or try again?
  //   if (isFinite(sr)) return [input, sr];
  //   return this.sample();
  // }

  /** From one random investor pick a random period and generate input and output training data */
  private random_sample(): Features {
    // Choose random investor
    const index = Math.floor(Math.random() * this.instruments.length);
    const instrument: Instrument = this.instruments[index];

    // Pick a random point in chart for training data
    // where both enough input and enough output data is available
    const available_bars: number = instrument.length;
    const input_offset: number = Math.floor(
      (available_bars - this.required_bars) * Math.random(),
    );
    const bar: Bar = instrument.end + input_offset + this.future_bars;

    // console.log({
    //   start: instrument.start,
    //   end: instrument.end,
    //   available_bars,
    //   input_bars: this.past_bars,
    //   output_bars: this.future_bars,
    //   gap_bars: this.gap_bars,
    //   required_bars: this.required_bars,
    //   input_offset,
    //   bar,
    // });
    // const input: Input = sample.input(bar, this.past_bars);
    // const output: Output = sample.output(bar, this.future_bars);

    const sample: Features = new Features(
      instrument,
      this.past_bars,
      this.gap_bars,
      this.future_bars,
      bar,
    );
    return sample;

    // Valid result or try again?
    // if (isFinite(output[0])) return [input, output];

    // console.log({ input, output });
    // throw new Error("Invalid output");
    // return this.sample();
  }

  /** Keep trying to generate a sample until output is Finite */
  private training_sample(): Features {
    const sample = this.random_sample();
    if (isFinite(sample.output[0])) return sample;
    else return this.training_sample();
  }

  /** Generate a number of sample for training/validation */
  public samples(count: number): Features[] {
    // const inputs: Inputs = [];
    // const outputs: Outputs = [];
    // Array.from({ length: count }).forEach(() => {
    //   const sample = this.training_sample();
    //   // const [input, output] = this.training_sample();
    //   inputs.push(sample.input);
    //   outputs.push(sample.output);
    // });

    // // console.log({ samples });
    // return [inputs, outputs];

    return Array.from({ length: count }).map(() => this.training_sample());
  }
}
