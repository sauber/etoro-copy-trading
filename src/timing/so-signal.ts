import { Signal } from "./signal.ts";

export class StochasticOscillator extends Signal {
  constructor(
    private readonlyperiod: number = 14,
  ) {
    super();
  }

  /** Convert series of values to series of signals */
  get(series: Series): Series {
    // Implement the Stochastic Oscillator calculation here
    const kValues: number[] = [];
    const dValues: number[] = [];
    return series;
  }
}
