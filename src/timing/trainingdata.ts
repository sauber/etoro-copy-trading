import { Community, type Investors, type Names } from "📚/repository/mod.ts";
import { Instrument } from "📚/timing/instrument.ts";
import { Instruments } from "@sauber/backtest";

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

    // Convert
    return investors.map((i) => new Instrument(i));
  }
}
