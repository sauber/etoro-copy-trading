import { Bar, Instrument, Price } from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";
import { diffDate, today } from "📚/time/mod.ts";

// Todas date
const NOW = today();

// Maximum numbr of days chart data can be delayed
const OFFSET = 2;

/** Generate instrument from investor */
export class InvestorInstrument extends Instrument {
  constructor(investor: Investor) {
    const series = investor.chart.values;
    const end: Bar = Math.max(diffDate(investor.chart.end, NOW) - OFFSET, 0);
    const username = investor.UserName;
    super(series, end, username, investor.FullName);
  }

  /** Chart value at bar */
  public override price(bar: Bar): Price {
    if (!this.active(bar)) {
      throw new Error(
        `Bar index ${bar} is outside range ${this.start}->${this.end}.`,
      );
    }

    // Don't read beyond last value
    const index = Math.max(
      this.series.length - bar + this.end - 1,
      this.series.length - 1,
    );
    return this.series[index];
  }
}
