import {
  PurchaseOrder,
  PurchaseOrders,
  StrategyContext,
} from "@sauber/backtest";
import { InvestorRanking } from "📚/ranking/mod.ts";
import { InvestorInstrument } from "📚/trading/investor-instrument.ts";
import { PassThroughStrategy } from "📚/strategy/mod.ts";

/** Lookup ranking of each investor */
export class RankingStrategy extends PassThroughStrategy {
  constructor(private readonly model: InvestorRanking) {
    super();
  }

  // TODO: Identify 50% lowest ranking investors and close their positions
  /** Close positions where ranking score < 0 */
  // public close(context: StrategyContext): CloseOrders {
  //   return context.closeorders.filter((closeorder: CloseOrder) => {
  //     const instrument: Instrument = closeorder.position.instrument;

  //     // Portfolio may have items which are not investors, or investors which have no
  //     // data in repository. Pass through those instruments.
  //     if ("investor" in instrument) {
  //       const investor: Investor = instrument.investor as Investor;

  //       const score = this.model.predict(investor, instrument.end);
  //       // Confidence to close is high if ranking score is low
  //       const confidence = -score * closeorder.confidence;
  //       if (score < 0) {
  //         Object.assign(closeorder, { confidence });
  //         return true;
  //       } else {
  //         // Don't close if ranking score is positive
  //         return false;
  //       }
  //     } // Only rank investors, not other instruments
  //     else return true;
  //   });
  // }

  /** Open positions where ranking score > 0 */
  public override open(context: StrategyContext): PurchaseOrders {
    return context.purchaseorders
      // Add ranking score
      .map((po: PurchaseOrder) => {
        const instrument = po.instrument as InvestorInstrument;
        const score: number = this.model.predict(
          instrument.investor,
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
