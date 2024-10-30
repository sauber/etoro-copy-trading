import { DateFormat } from "../time/mod.ts";
 
export * from "./book.ts";
export * from "./simulation.ts";

/** Summary value for a day */
type Valuation = {
  date: DateFormat;
  positions: number;
  invested: number;
  cash: number;
  value: number;
};

/** Valuation day by day */
export type Performance = Array<Valuation>;
