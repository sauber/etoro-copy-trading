import {
  CloseOrder,
  CloseOrders,
  PurchaseOrder,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { Ranking } from "📚/ranking/mod.ts";
import { InvestorInstrument } from "📚/trading/investor-instrument.ts";

/** Lookup ranking of each investor */
export class RankingStrategy implements Strategy {
  constructor(private readonly model: Ranking) {}

  /** Close positions where ranking score < 0 */
  public close(context: StrategyContext): CloseOrders {
    return context.closeorders.filter((closeorder: CloseOrder) => {
      const instrument = closeorder.position.instrument as InvestorInstrument;
      const score = this.model.predict(instrument.investor, instrument.end);
      // Confidence to close is high if ranking score is low
      const confidence = -score * closeorder.confidence;
      if (score < 0) {
        Object.assign(closeorder, { confidence });
        return true;
      }
    });
  }

  /** Open positions where ranking score > 0 */
  public open(context: StrategyContext): PurchaseOrders {
    return context.purchaseorders
      // Add ranking score
      .map((po: PurchaseOrder) => {
        const instrument = po.instrument as InvestorInstrument;
        const score: number = this.model.predict(instrument.investor, instrument.end);
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
