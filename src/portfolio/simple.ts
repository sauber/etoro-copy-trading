import {
  Positions,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";

/** Open positions as ratio of total portfolio value */
export class SimplePortfolioStrategy implements Strategy {
  constructor(private readonly count: number) {}

  /** Open as many as possible */
  public open(context: StrategyContext): PurchaseOrders {
    const positionSize = context.value / this.count;
    let available = context.amount;

    // Sort positions by amount, highest first.
    // Pick as positions as possible.
    // Set to equal amount
    return context.positions
      .sort((a, b) => b.amount - a.amount)
      .filter((p) => {
        available -= positionSize;
        return available >= 0;
      }).map((p) => Object.assign({}, p, { amount: positionSize }));
  }

  /** Close all */
  public close(context: StrategyContext): Positions {
    return context.positions;
  }
}
