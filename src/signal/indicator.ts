export { type Input, limits, signal } from "./rsi.ts";

/** Minimum, maximum, default value and type of parameter */
export type Range = {
  min: number;
  max: number;
  default: number;
  int?: boolean;
};

/** Collection of ranges */
export type Limits = Record<string, Range>;
