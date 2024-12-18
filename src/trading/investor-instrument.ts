import { Bar, Instrument, Price } from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";

// Maximum numbr of days chart data can be delayed
const EXTEND = 2;

/** Generate instrument from investor */
export class InvestorInstrument extends Instrument {
  public override readonly end: Bar;
  constructor(public readonly investor: Investor) {
    const end = investor.chart.end;
    const username = investor.UserName;
    super(investor.chart.values, end, username, investor.FullName);
    this.end = end - EXTEND;
  }

  public override price(bar: Bar): Price {
    const shift: number = Math.max(0, bar - this.end);
    const index: number = this.buffer.length - bar + this.end - 1 + shift;
    const value: Price = this.buffer[index];
    return value;
  }
}
