import {
  Bar,
  Instrument,
  Positions,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { RSIStrategy } from "../technical/rsi-strategy.ts";
import { nextDate, today } from "📚/time/calendar.ts";

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

  private readonly technical: Strategy;
  public readonly window: number = 21;
  public readonly buy: number = 30;
  public readonly sell: number = 70;

  constructor(params: Partial<TradingStrategy> = {}) {
    Object.assign(this, params);
    this.timing = new WeekdayStrategy(this.weekday);
    this.technical = new RSIStrategy(this.window, this.buy, this.sell);
  }

  /** Print out conect of Context */
  private printContext(context: StrategyContext): void {
    console.log(
      "Context: Bar",
      context.bar,
      "Date",
      nextDate(today(), -context.bar),
    );
    console.log("  Value", context.value, "Amount", context.amount);
    console.log("  Positions", context.positions.length);
    console.log("  Instruments", context.instruments.length);
  }

  public close(context: StrategyContext): Positions {
    console.log("Closing strategies");
    this.printContext(context);
    const strategies: Array<Strategy> = [this.timing, this.technical];

    let positions: Positions = [];
    for (const strategy of strategies) {
      positions = strategy.close(context);
      Object.assign(context, { positions });
      this.printContext(context);
      if (positions.length < 1) return [];
    }
    return positions;
  }

  public open(context: StrategyContext): PurchaseOrders {
    console.log("Opening strategies");
    this.printContext(context);
    const strategies: Array<Strategy> = [this.timing, this.technical];

    let pos: PurchaseOrders = [];
    for (const strategy of strategies) {
      pos = strategy.open(context);
      Object.assign(context, { instruments: pos.map((po) => po.instrument) });
      this.printContext(context);
      if (pos.length < 1) return [];
    }
    return pos;
  }
}
