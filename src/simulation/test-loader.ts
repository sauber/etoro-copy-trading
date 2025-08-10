import { Investor } from "📚/investor/mod.ts";
import { Loader } from "./loader.ts";

/** Load data to generate Strategy context */
export class TestLoader extends Loader {
  protected override async investor(username: string): Promise<Investor> {
    const prev = this._investors.get(username);
    if (prev) return prev;

    const lock = this.investor_semaphore(username);
    await lock.acquire();
    if (this._investors.has(username)) {
      const investor: Investor = this._investors.get(username) as Investor;
      return investor;
    }
    try {
      const investor: Investor = await this.assets.testcommunity.investor(
        username,
      );
      console.log("Loaded Test Investor", username);
      this._investors.set(username, investor);
      return investor;
    } finally {
      lock.release();
    }
  }
}
