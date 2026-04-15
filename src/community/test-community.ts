import { Investor } from "📚/investor/mod.ts";
import { InvestorAssembly } from "📚/repository/investor-assembly.ts";
import { Community } from "./community.ts";
import { DateFormat } from "📚/tick/mod.ts";

/** Investors with untrended charts */
export class TestCommunity extends Community {
  /** Create and cache Investor test object */
  public override async investor(username: string): Promise<Investor> {
    const key = username.toLowerCase() + "_test";
    if (!(key in this._loaded)) {
      const start: DateFormat = await this.chartStart();
      const assembly = new InvestorAssembly(username, this.repo, start);
      this._loaded[key] = await assembly.testInvestor();
    }
    return this._loaded[key];
  }
}
