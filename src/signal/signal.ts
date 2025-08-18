import { Bar, Instrument, Series } from "@sauber/backtest";
import {
  Parameters,
  parameters,
  stochastic as indicator,
} from "./stochastic.ts";

// TODO: Move to stochastic.ts and be specific about each key required
export type Exported = Record<string, number>;

/** Calculate a series of buying and sell opportunity from instrument chart */
export class Signal {
  constructor(private readonly parameters: Parameters) {}

  /** Default parameters for signal */
  public static default(): Signal {
    const p = parameters();
    return new this(p);
  }

  /** Random parameters for signal */
  public static random(): Signal {
    const p = parameters();
    p.forEach((param) => param.set(param.random));
    return new this(p);
  }

  /** Create instance from imported values */
  public static import(values: Exported): Signal {
    const p = parameters();
    p.forEach((param) => {
      const value = values[param.name];
      if (value === undefined) {
        throw new Error(`Missing parameter ${param.name}`);
      }
      param.set(value);
    });
    return new this(p);
  }

  /** Dict of parameter values */
  public export(): Exported {
    return this.parameters.reduce((acc, p) => {
      acc[p.name] = p.value;
      return acc;
    }, {} as Exported);
  }

  /** Generate signal from instrument */
  public generate(instrument: Instrument): Instrument {
    const signals: Series = indicator(instrument.series, this.parameters);
    const result = new Instrument(
      signals,
      instrument.end,
      instrument.symbol,
      instrument.name + ":signal",
    );
    return result;
  }

  /** Signal value at bar */
  public predict(instrument: Instrument, bar: Bar): number {
    const chart: Instrument = this.generate(instrument);
    return chart.price(bar);
  }
}
