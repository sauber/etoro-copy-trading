import { CloseOrders, StrategyContext } from "@sauber/backtest";
import { PassThroughStrategy } from "📚/strategy/pass-through-strategy.ts";

/** Close positions when value is below stoploss threshold */
export class StopLossStrategy extends PassThroughStrategy {
  constructor(private readonly threshold: number) {
    super();
  }

  /** List of positions where value is below threshold */
  public override close(context: StrategyContext): CloseOrders {
    const cos = context.closeorders;
    return cos.filter((co) =>
      (co.position.value(context.bar) / co.position.invested) < this.threshold
    );
  }
}
