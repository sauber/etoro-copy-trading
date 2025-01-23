import { Instrument } from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";

/** Generate instrument from investor */
export class InvestorInstrument extends Instrument {
  constructor(public readonly investor: Investor) {
    const end = investor.chart.end;
    const username = investor.UserName;
    super(investor.chart.values, end, username, investor.FullName);
  }
}
