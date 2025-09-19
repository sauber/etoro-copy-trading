import { assert } from "@std/assert";
import { DiscoverResults } from "@sauber/etoro-investors";
import type { InvestorId } from "./types.ts";

export class Discover {
  constructor(private readonly raw: DiscoverResults) {}

  public validate(): boolean {
    assert(this.raw.TotalRows >= 1, `TotalRows ${this.raw.TotalRows} < 1`);
    return true;
  }

  public get investors(): InvestorId[] {
    return this.raw.Items.map((item) => ({
      UserName: item.UserName,
      CustomerId: item.CustomerId,
    }));
  }

  public get count(): number {
    return this.raw.TotalRows;
  }
}
