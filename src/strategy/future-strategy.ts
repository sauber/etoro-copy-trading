import {
  Bar,
  PurchaseOrder,
  PurchaseOrders,
  StrategyContext,
} from "@sauber/backtest";
import { PassThroughStrategy } from "./pass-through-strategy.ts";

/** Only open if there is sufficient number of bars available to have a chance to close again later */
export class FutureStrategy extends PassThroughStrategy {
  constructor(private readonly bars: number) {
    super();
  }

  public override open(context: StrategyContext): PurchaseOrders {
    const pos = context.purchaseorders;
    const end: Bar = context.bar - this.bars;
    return pos.filter((po: PurchaseOrder) => po.instrument.end < end);
  }
}
