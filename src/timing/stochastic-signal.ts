import {
  IntegerParameter,
  Parameters as TrainingParameters,
} from "@sauber/optimize";
import { Signal } from "./signal.ts";
import { Stochastic as Indicator } from "@debut/indicators";
import { Series } from "@sauber/backtest";

/** %K and %D return type from Indicator */
type KD = {
  k: number;
  d: number;
};

export type Parameters = {
  window: number;
  smoothing: number;
  buy: number;
  sell: number;
};

/** Generate signal based on Stochastic Oscillator indicator */
export class Stochastic implements Signal {
  public readonly window: number = 14;
  public readonly smoothing: number = 3;
  public readonly buy: number = 20;
  public readonly sell: number = 80;

  constructor(values: Parameters) {
    // Confirm all parameters are incluced
    for (const param of Stochastic.parameters()) {
      if (!(param.name in values)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }
    }
    // Apply values
    Object.assign(this, values);
  }

  /** All tunable parameters for this indicator */
  public static parameters(): TrainingParameters {
    return [
      new IntegerParameter("window", 2, 50, 14),
      new IntegerParameter("smoothing", 1, 49, 3),
      new IntegerParameter("buy", 1, 49, 20),
      new IntegerParameter("sell", 51, 99, 80),
    ];
  }

  public parameters: TrainingParameters = Stochastic.parameters();

  /** Convert series of values to series of signals */
  public get(series: Series): Series {
    // Stochastic Oscillator calculation
    const indicator = new Indicator(
      this.window,
      this.smoothing,
    );
    let prev: number;
    const momentum: Array<KD> = Array.from(series).map(
      (close) => {
        const high = Math.max(prev, close) || close;
        const low = Math.min(prev, close) || close;
        prev = close;
        return indicator.nextValue(high, low, close);
      },
    );

    // Overbought and oversold levels
    const overbought = this.sell;
    const oversold = this.buy;

    // Compress indicator into overbought, oversold range
    const signals = momentum.map((value: KD) => {
      if (!value || !value.k || !value.d) return 0; // Handle undefined values
      const k = value.k;
      const d = value.d;
      if (d > overbought && k < d) {
        // Bring range of overbought to 100 into range of 0 to 1
        return (d - overbought) / (100 - overbought);
      } else if (d < oversold && k > d) {
        // Bring range of oversold to 0 into range of 0 to -1
        return (d - oversold) / oversold;
      }
      return 0;
    });

    return new Float32Array(signals);
  }
}
