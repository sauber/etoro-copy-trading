import { Amount, PurchaseOrders, StrategyContext } from "@sauber/backtest";
import { PassThroughStrategy } from "📚/strategy/pass-through-strategy.ts";

/** Round position amount */
export class RoundingStrategy extends PassThroughStrategy {
  constructor(private readonly increment: Amount) {
    super();
  }

  public override open(context: StrategyContext): PurchaseOrders {
    return context.purchaseorders
      .map((po) => ({
        instrument: po.instrument,
        amount: this.increment * Math.round(po.amount / this.increment),
      }))
      .filter((po) => po.amount > 0);
  }
}
