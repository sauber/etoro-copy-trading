import { PurchaseOrders, StrategyContext } from "@sauber/backtest";
import { PassThroughStrategy } from "📚/strategy/pass-through-strategy.ts";

// TODO:
// - Ensure that total (previous plus new) amount in each investor does not exceed target amount

/** Holistic sizing of positions */
export class SizingStrategy extends PassThroughStrategy {
  constructor(private readonly ratio: number = 0.1) {
    super();
  }

  public override open(context: StrategyContext): PurchaseOrders {
    const po = context.purchaseorders;
    if (po.length < 1) return [];
    const sorted: PurchaseOrders = po.sort((a, b) => b.amount - a.amount);
    const limit: PurchaseOrders = sorted.slice(0, 3);

    return limit.map((po) => ({
      instrument: po.instrument,
      amount: context.value * this.ratio,
    }));
  }
}
