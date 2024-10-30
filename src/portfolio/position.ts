import type { DateFormat } from "../time/mod.ts";
import { Chart } from "📚/chart/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { nanoid } from "nanoid";

// TODO:
// takeprofit?: number;
// stoploss?: number;
// trailing?: boolean;
// days_min?: number;
// days_max?: number;

/** Information about a position */
export class Position {
  // Generate uniq ID
  public readonly id: string = nanoid(8);
  public readonly name: string;

  constructor(
    // Investor
    public readonly investor: Investor,
    // Date of opening
    public readonly date: DateFormat,
    // Amount invested
    public readonly amount: number,
  ) {
    this.name = investor.UserName;
  }

  /** Calculate profits since opening until date */
  public profit(date: DateFormat): number {
    const chart: Chart = this.investor.chart;
    const first = chart.value(this.date);
    const last = chart.value(date);
    const profit = this.amount * (last / first - 1);
    return profit;
  }

  /** Value of position on date (amount + profit) */
  public value(date: DateFormat): number {
    return this.amount + this.profit(date);
  }

  /** Confirm if position is within date range of available investor data */
  public expired(date: DateFormat): boolean {
    return date > this.investor.chart.end;
  }

  /**
   * Verify if position hit any of the limits
   * TODO: Not implemented
   */
  public limited(_date: DateFormat): boolean {
    return false;
  }

  /** Confirm if position is considere to still be open */
  public open(date: DateFormat): boolean {
    return ! this.expired(date) && ! this.limited(date);
  }
}
