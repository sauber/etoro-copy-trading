import { Bar, Instrument, Series } from "@sauber/backtest";
import {
  inputParameters,
  stochastic as indicator,
} from "./stochastic.ts";

// TODO: Move to stochastic.ts and be specific about each key required
export type Exported = Record<string, number>;
type Input = Record<keyof typeof inputParameters, number>;

/** Calculate a series of buying and sell opportunity from instrument chart */
export class Signal {
  constructor(private readonly values: Input) {}

  /** Default parameters for signal */
  public static default(): Signal {
    const defaultValues = Object.fromEntries(
      Object.entries(inputParameters).map(([name, param]) => [name, param.default])
    ) as Input;
    return new this(defaultValues);
  }

  /** Random parameters for signal */
  public static random(): Signal {
    const randomValues = Object.fromEntries(
      Object.entries(inputParameters).map(([name, param]) => {
        const value = Math.random() * (param.max - param.min) + param.min;
        return [name, param.int ? Math.round(value) : value];
      })
    ) as Input;
    return new this(randomValues);
  }

  /** Create instance from imported values */
  public static import(values: Exported): Signal {
    for (const key of Object.keys(inputParameters)) {
      if (!(key in values)) {
        throw new Error(`Missing parameter ${key}`);
      }
    }
    return new this(values as Input);
  }

  /** Dict of parameter values */
  public export(): Exported {
    return this.values;
  }

  /** Generate signal from instrument */
  public generate(instrument: Instrument): Instrument {
    const signals: Series = indicator(instrument.series, this.values);
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
    const chart: Instrument = this.generate(instrument);    return chart.price(bar);
  }
}