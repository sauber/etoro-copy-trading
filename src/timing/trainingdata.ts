import { Community, type Investors, type Names } from "📚/repository/mod.ts";
import { Instrument, Instruments } from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";
import { DateFormat, diffDate } from "📚/time/mod.ts";

/** Convert investors to simulation instruments */
export class TrainingData {
  constructor(private readonly community: Community) {}

  /** Load all investors and convert to instruments */
  public async load(): Promise<Instruments> {
    // Load source data
    const names: Names = await this.community.allNames();
    const investors: Investors = await Promise.all(
      names.map((name) => this.community.investor(name)),
    );

    // Most recent end
    const ends: Array<DateFormat> = investors.map((investor: Investor) =>
      investor.chart.end
    );
    ends.sort();
    const last: DateFormat = ends[ends.length - 1];

    // Convert
    return investors.map((investor: Investor) =>
      new Instrument(
        investor.chart.values,
        diffDate(investor.chart.end, last),
        investor.UserName,
        investor.FullName,
      )
    );
  }
}
