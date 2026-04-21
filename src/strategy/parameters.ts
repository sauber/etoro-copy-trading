import { Instrument } from "@sauber/backtest";
import { Tick } from "📚/tick/mod.ts";

/** Minimum, maximum, default value and type of parameter */
export type Range = {
  min: number;
  max: number;
  default: number;
  int?: boolean;
};

/** Short name of instrument */
export type Symbol = string;

/** Collection of ranges */
export type Limits = Record<string, Range>;

export type Rater = (instrument: Instrument, tick: Tick) => number;

/** Min and max values for portfolio management */
export const strategyParameters: Limits = {
  weekday: { min: 1, max: 5, default: 1, int: true },
  position_size: { min: 0.005, max: 0.2, default: 0.07 },
  stoploss: { min: 0.85, max: 0.95, default: 0.85 },
  limit: { min: 1, max: 15, default: 3, int: true },
};
export type Input = Record<keyof typeof strategyParameters, number>;

// export type Input = {
//   weekday: number;
//   position_size: number;
//   stoploss: number;
//   limit: number;
// };

/** Assert that parameters are within limits */
export function validation(settings: Input): boolean {
  const limits = strategyParameters;
  for (const [name, limit] of Object.entries(limits)) {
    const value: number = settings[name];
    if (value === undefined) throw new Error(`Missing parameter ${name}`);
    if (value < limit.min || value > limit.max) {
      throw new Error(
        `Parameter ${name} out of range [${limit.min}, ${limit.max}]: ${value}`,
      );
    }
  }
  return true;
}
