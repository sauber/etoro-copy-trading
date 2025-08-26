import { Bar, Instrument, Series } from "@sauber/backtest";
import { Backend } from "@sauber/journal";
import { Config } from "../config/config.ts";
import { limits, signal } from "./indicator.ts";

// TODO: Move to stochastic.ts and be specific about each key required
export type Settings = Record<string, number>;
// type Input = Record<keyof typeof inputParameters, number>;

/** Calculate a series of buying and sell opportunity from instrument chart */
export class Signal {
  /** Name of settings group in config asset */
  static readonly assetName = "signal";

  constructor(private readonly values: Settings) {
    this.validate(values);
  }

  /** Confirm parameters are valid */
  private validate(values: Settings): boolean {
    // Confirm all required parameters are included
    for (const key of Object.keys(limits)) {
      if (!(key in values)) {
        throw new Error(`Missing parameter ${key}`);
      }
    }

    // Confirm no irrelevant values are included
    for (const key of Object.keys(values)) {
      if (!(key in limits)) {
        throw new Error(`Unknown parameter ${key}`);
      }
    }

    // Confirm all parameters are within range
    for (const [key, value] of Object.entries(values)) {
      const param = limits[key];
      if (value < param.min || value > param.max) {
        throw new Error(`Parameter ${key} out of range`);
      }
    }

    return true;
  }

  /** Default parameters for signal */
  public static default(): Signal {
    const defaultValues = Object.fromEntries(
      Object.entries(limits).map((
        [name, param],
      ) => [name, param.default]),
    ) as Settings;
    return new this(defaultValues);
  }

  /** Random parameters for signal */
  public static random(): Signal {
    const randomValues = Object.fromEntries(
      Object.entries(limits).map(([name, param]) => {
        const value = Math.random() * (param.max - param.min) + param.min;
        return [name, param.int ? Math.round(value) : value];
      }),
    ) as Settings;
    return new this(randomValues);
  }

  /** Create instance with values */
  public static import(values: Settings): Signal {
    for (const key of Object.keys(limits)) {
      if (!(key in values)) {
        throw new Error(`Missing parameter ${key}`);
      }
    }
    return new this(values as Settings);
  }

  /** Parameter values */
  public export(): Settings {
    return this.values;
  }

  /** Create instance with parameters from repository */
  public static async load(repo: Backend): Promise<Signal> {
    const config: Config = new Config(repo);
    const values = await config.get(this.assetName) as Settings;
    return this.import(values);
  }

  /** Save parameter to repositpory */
  public async save(repo: Backend): Promise<void> {
    const config: Config = new Config(repo);
    await config.set(Signal.assetName, this.export());
  }

  /** Generate signal from instrument */
  public generate(instrument: Instrument): Instrument {
    const signals: Series = signal(instrument.series, this.values);
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
