import {
  CloseOrders,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";

/** Run strategy at older bar */
export class DelayStrategy implements Strategy {
  constructor(
    private readonly bars: number,
    private readonly strategy: Strategy,
  ) {}

  public close(context: StrategyContext): CloseOrders {
    context.bar += this.bars;
    const co: CloseOrders = this.strategy.close(context);
    context.bar -= this.bars;
    return co;
  }

  public open(context: StrategyContext): PurchaseOrders {
    context.bar += this.bars;
    const po: PurchaseOrders = this.strategy.open(context);
    context.bar -= this.bars;
    return po;
  }
}
