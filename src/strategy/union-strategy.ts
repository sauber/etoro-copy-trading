import {
  CloseOrder,
  CloseOrders,
  PurchaseOrder,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";

/** Merge output from two or more strategies */
export class UnionStrategy implements Strategy {
  constructor(private readonly strategies: Strategy[]) {}

  public close(context: StrategyContext): CloseOrders {
    return Array.from(
      new Set<CloseOrder>(this.strategies.map((s) => s.close(context)).flat()),
    );
  }

  public open(context: StrategyContext): PurchaseOrders {
    return Array.from(
      new Set<PurchaseOrder>(
        this.strategies.map((s) => s.open(context)).flat(),
      ),
    );
  }
}
