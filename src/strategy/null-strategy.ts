import {
  Positions,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";

/** Buy nothing, sell nothing */
export class NullStrategy implements Strategy {
  public open(_context: StrategyContext): PurchaseOrders {
    return [];
  }

  public close(_context: StrategyContext): Positions {
    return [];
  }
}
