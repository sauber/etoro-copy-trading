import { Instrument } from "@sauber/trading-account";
import { Investor } from "📚/investor/mod.ts";
import { formatDate } from "📚/time/mod.ts";

export class InvestorInstrument extends Instrument {
  public override readonly symbol: string;

  constructor(private readonly _investor: Investor) {
    super(_investor.UserName);
    this.symbol = _investor.UserName;
  }

  public override price(time: Date) {
    return this._investor.chart.value(formatDate(time.getTime()));
  }

  /** Does investor have price data available in chart? */
  public override active(time: Date): boolean {
    return this._investor.active(formatDate(time.getTime()));
  }

  public get investor(): Investor {
    return this._investor;
  }
}
