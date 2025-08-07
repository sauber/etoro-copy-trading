import { IntegerParameter, Parameters } from "@sauber/optimize";
import { Signal } from "./signal.ts";
import { Stochastic as Indicator } from "@debut/indicators";
import { Series } from "@sauber/backtest";

/** %K and %D return type from Indicator */
type KD = {
  k: number;
  d: number;
};

/** Generate signal based on Stochastic Oscillator indicator */
export class Stochastic implements Signal {
  constructor(
    private readonly window: number = 14,
    private readonly smoothing: number = 3,
    private readonly buy_level: number = 20,
    private readonly sell_level: number = 80,
  ) {
  }

  /** All tunable parameters for this indicator */
  public static parameters(): Parameters {
    return [
      new IntegerParameter("window", 2, 50, 14),
      new IntegerParameter("smoothing", 1, 49, 3),
      new IntegerParameter("buy", 1, 49, 20),
      new IntegerParameter("sell", 51, 99, 80),
    ];
  }

  public parameters: Parameters = Stochastic.parameters();

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
    const overbought = this.sell_level;
    const oversold = this.buy_level;

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
