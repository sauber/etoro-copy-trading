import { Bar, Instrument, Series } from "@sauber/backtest";
import { score } from "./minmax.ts";

export type Input = number[];
export type Output = [number];

/** From investor extract input and data for training of model and for prediction */
export class Features {
  /** Input data for prediction */
  private input_cache: Input | undefined = undefined;

  /** Output data for training */
  private output_cache: Output | undefined = undefined;

  constructor(
    /** Source instrument */
    public readonly instrument: Instrument,
    // Number of bars of input data
    private readonly past: number,
    // Number of bars between input data and bar requested
    private readonly gap: number,
    // Number of bars of output data
    private readonly future: number,
    // End bar for input data
    public readonly end: Bar,
  ) {}

  /** Extract input data */
  public get input(): Input {
    if (!this.input_cache) {
      this.input_cache = [...Array(this.past).keys()].reverse().map((index) => {
        const bar = this.end + this.gap + index;
        const value = this.instrument.price(bar);
        const prev = this.instrument.price(bar + 1);
        return (value - prev) / prev;
      });
    }
    return this.input_cache;
  }

  /** Extract output data */
  public get output(): Output {
    if (!this.output_cache) {
      const series: Series =
        this.instrument.slice(this.end, this.end - this.future).series;
      const profit = score(series);
      this.output_cache = [profit];
    }
    return this.output_cache;
  }
}
