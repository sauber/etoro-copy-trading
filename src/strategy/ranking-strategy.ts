import {
  Position,
  PurchaseOrder,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { Positions } from "https://jsr.io/@sauber/backtest/0.6.0/src/position.ts";
import { Ranking } from "📚/ranking/mod.ts";
import { InvestorInstrument } from "📚/trading/investor-instrument.ts";

/** Lookup ranking of each investor */
export class RankingStrategy implements Strategy {
  constructor(private readonly model: Ranking) {}

  /** Close positions where ranking score < 0 */
  public close(context: StrategyContext): Positions {
    return context.positions.filter((position: Position) => {
      const instrument = position.instrument as InvestorInstrument;
      const score = this.model.predict(instrument.investor);
      if (score < 0) return true;
    });
  }

  /** Open positions where ranking score > 0 */
  public open(context: StrategyContext): PurchaseOrders {
    return context.purchaseorders
      // Add ranking score
      .map((po: PurchaseOrder) => {
        const instrument = po.instrument as InvestorInstrument;
        const score: number = this.model.predict(instrument.investor);
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
