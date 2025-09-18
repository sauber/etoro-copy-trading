import { PortfolioResults } from "@sauber/etoro-investors";

export type Mirror = {
  CustomerId: number;
  UserName: string;
  Value: number;
};

export class Portfolio {
  constructor(private readonly raw: PortfolioResults) {}

  public validate(): boolean {
    if (!("CreditByRealizedEquity" in this.raw)) {
      throw new Error(`Portfolio CreditByRealizedEquity missing)`);
    }
    return true;
  }

  public get mirrors(): Mirror[] {
    return this.raw.AggregatedMirrors.map((investor) => {
      return {
        UserName: investor.ParentUsername,
        CustomerId: investor.ParentCID,
        Value: investor.Value,
      };
    });
  }
}
