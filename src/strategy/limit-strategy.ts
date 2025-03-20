import { CloseOrders, PurchaseOrders, StrategyContext } from "@sauber/backtest";
import { assert } from "@std/assert/assert";
import { PassThroughStrategy } from "📚/strategy/pass-through-strategy.ts";

/** Limit count of orders */
export class LimitStrategy extends PassThroughStrategy {
  constructor(private readonly count: number) {
    assert(count > 0, "Count must be positive");
    super();
  }

  public override open(context: StrategyContext): PurchaseOrders {
    const po = context.purchaseorders;
    const sorted: PurchaseOrders = po.sort((a, b) => b.amount - a.amount);
    const limit: PurchaseOrders = sorted.slice(0, this.count);
    return limit;
  }

  public override close(context: StrategyContext): CloseOrders {
    const co = context.closeorders;
    const sorted: CloseOrders = co.sort((a, b) =>
      b.position.value(context.bar) - a.position.value(context.bar)
    );
    const limit: CloseOrders = sorted.slice(0, this.count);
    return limit;
  }
}
