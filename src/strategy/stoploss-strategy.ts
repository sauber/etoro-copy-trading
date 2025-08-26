import { CloseOrders, PurchaseOrders, StrategyContext } from "@sauber/backtest";
import { PassThroughStrategy } from "./pass-through-strategy.ts";

/** Close positions when value is below stoploss threshold */
export class StopLossStrategy extends PassThroughStrategy {
  constructor(private readonly threshold: number) {
    super();
  }

  /** Open no positions */
  public override open(_context: StrategyContext): PurchaseOrders {
    return [];
  }

  /** List of positions where value is below threshold */
  public override close(context: StrategyContext): CloseOrders {
    // console.log("StopLoss close bar", context.bar);
    const cos = context.closeorders;
    return cos
      .filter((co) =>
        (co.position.value(context.bar) / co.position.invested) < this.threshold
      )
      .map((co) => ({ ...co, reason: "Loss" }));
  }
}
