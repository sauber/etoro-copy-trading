import { Instrument } from "@sauber/trading-account";
import { Investor } from "📚/investor/mod.ts";
import { formatDate } from "📚/time/mod.ts";

export class InvestorInstrument extends Instrument {
  constructor(private readonly investor: Investor) {
    super(investor.UserName);
  }

  public override price(time: Date) {
    return this.investor.chart.value(formatDate(time.getTime()));
  };

  /** Does investor have price data available in chart? */
  public override active(time: Date): boolean {
    return this.investor.active(formatDate(time.getTime()));
  }
}
