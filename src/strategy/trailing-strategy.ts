import {
  Amount,
  Bar,
  CloseOrders,
  PurchaseOrders,
  StrategyContext,
} from "@sauber/backtest";
import { PassThroughStrategy } from "./pass-through-strategy.ts";

/** Close positions when value is below trailing stoploss threshold */
export class TrailingStrategy extends PassThroughStrategy {
  constructor(private readonly threshold: number) {
    super();
  }

  /** Open no positions */
  public override open(_context: StrategyContext): PurchaseOrders {
    return [];
  }

  /** List of positions where value is below threshold */
  public override close(context: StrategyContext): CloseOrders {
    return context.closeorders
      .filter((co) => {
        const current: Amount = co.position.value(context.bar);
        const above: Amount = current / this.threshold;
        const start: Bar = co.position.start;
        for (let i = context.bar; i < start; i++) {
          if (co.position.value(i) > above) return true;
        }

        return false;
      })
      .map((co) => ({ ...co, reason: "Loss" }));
  }
}
