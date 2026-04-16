import { Investor } from "📚/investor/mod.ts";
import { InvestorAssembly } from "📚/repository/mod.ts";
import { Community } from "./community.ts";

/** Investors with untrended charts */
export class TestCommunity extends Community {
  /** Create and cache Investor test object */
  public override async investor(username: string): Promise<Investor> {
    const key = username.toLowerCase() + "_test";
    if (!(key in this._loaded)) {
      const timeline = await this.timeline();
      const assembly = new InvestorAssembly(username, this.repo, timeline);
      this._loaded[key] = await assembly.testInvestor();
    }
    return this._loaded[key];
  }
}
