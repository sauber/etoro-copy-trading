import {
  PurchaseOrder,
  PurchaseOrders,
  StrategyContext,
} from "@sauber/backtest";
import { InvestorRanking } from "📚/ranking/investor-ranking.ts";
import { PassThroughStrategy } from "📚/strategy/mod.ts";
import { Investor } from "📚/investor/mod.ts";

/** Lookup ranking of each investor */
export class RankingStrategy extends PassThroughStrategy {
  constructor(private readonly model: InvestorRanking) {
    super();
  }

  // Close on signal regardless of rank

  /** Open positions where ranking score > 0 */
  public override open(context: StrategyContext): PurchaseOrders {
    return context.purchaseorders
      // Add ranking score
      .map((po: PurchaseOrder) => {
        const instrument = po.instrument as Investor;
        const score: number = this.model.predict(
          instrument,
          instrument.end,
        );
        return [po, score] as [PurchaseOrder, number];
      })
      // Ensure score > 0
      .filter(([_po, score]) => score > 0)
      // Multiply amount with score
      .map(([po, score]) => {
        Object.assign(po, { amount: po.amount * score });
        return po;
      });
  }
}
