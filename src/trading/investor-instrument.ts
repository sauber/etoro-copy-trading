import { Bar, Instrument, Price } from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";
import { diffDate, today } from "📚/time/mod.ts";

// Today's date
const NOW = today();

// Maximum numbr of days chart data can be delayed
const EXTEND = 2;

/** Generate instrument from investor */
export class InvestorInstrument extends Instrument {
  constructor(public readonly investor: Investor) {
    // Extend series with last value
    const last = investor.chart.last;
    const series: Array<Price> = [
      ...investor.chart.values,
      ...Array(EXTEND).fill(last),
    ];

    // Extend end
    const end: Bar = diffDate(investor.chart.end, NOW) - EXTEND;
    const username = investor.UserName;
    super(series, end, username, investor.FullName);
  }
}
