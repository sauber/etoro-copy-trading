import {
  Bar,
  Positions,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";

/** Only trade on certain day of week */
export class WeekdayStrategy implements Strategy {
  constructor(public readonly weekday: number) {}

  private trading(bar: Bar): boolean {
    return (this.weekday - bar % 7 === 0);
  }

  public open(context: StrategyContext): PurchaseOrders {
    return this.trading(context.bar)
      ? context.instruments.map((instrument) => ({ instrument, amount: 1 }))
      : [];
  }

  public close(context: StrategyContext): Positions {
    return this.trading(context.bar) ? context.positions : [];
  }
}

/**
 * Combination of several strategies:
 * - Timing - Is this correct time to trade
 * - Fundamental - Screening and ranking of investors
 * - Technical - Identify opportunities
 * - Portfolio - Count and sizing of positions
 * - others...?
 */
export class TradingStrategy implements Strategy {
  private readonly timing: Strategy;
  public readonly weekday: number = 1;

  constructor(params: Partial<TradingStrategy> = {}) {
    Object.assign(this, params);
    this.timing = new WeekdayStrategy(this.weekday);
  }

  public open(context: StrategyContext): PurchaseOrders {
    return this.timing.open(context);
  }

  public close(context: StrategyContext): Positions {
    return this.timing.close(context);
  }
}
