import {
  Bar,
  Positions,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { RSIStrategy } from "📚/technical/rsi-strategy.ts";
import { nextDate, today } from "📚/time/calendar.ts";
import { DateFormat } from "📚/time/mod.ts";

export type Parameters = {
  weekday: number;
};

/** Convert date to name of weekday */
function getWeekdayFromDate(dateString: DateFormat): string {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const date = new Date(dateString);
  const dayIndex = date.getDay();
  return daysOfWeek[dayIndex];
}

/** Only trade on certain day of week */
export class WeekdayStrategy implements Strategy {
  constructor(private readonly weekday: number) {}

  private trading(bar: Bar): boolean {
    return (this.weekday - bar % 7 === 0);
  }

  public close(context: StrategyContext): Positions {
    return this.trading(context.bar) ? context.positions : [];
  }

  public open(context: StrategyContext): PurchaseOrders {
    return this.trading(context.bar) ? context.purchaseorders : [];
  }
}

/** Adjust purchase order sizes to maximum and minimum ratio of value */
export class MinMaxStrategy implements Strategy {
  constructor(
    private readonly min: number = 0.01,
    private readonly max: number = 0.1,
  ) {}

  public close = (context: StrategyContext): Positions => context.positions;

  public open(_context: StrategyContext): PurchaseOrders {
    return [];
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
  private printContext(strategy: Strategy, context: StrategyContext): void {
    const date: DateFormat = nextDate(today(), -context.bar);
    console.log(strategy.constructor.name);
    console.log("  Bar:", context.bar, "Date:", getWeekdayFromDate(date), date);
    console.log("  Value:", context.value, "Amount:", context.amount);
    console.log("  Positions:", context.positions.length);
    console.log("  POs:", context.purchaseorders.length);
  }

  public close(context: StrategyContext): Positions {
    console.log("Closing strategies");
    this.printContext(this, context);
    const strategies: Array<Strategy> = [this.timing, this.technical];

    let positions: Positions = [];
    for (const strategy of strategies) {
      positions = strategy.close(context);
      Object.assign(context, { positions });
      this.printContext(strategy, context);
      if (positions.length < 1) return [];
    }
    return positions;
  }

  public open(context: StrategyContext): PurchaseOrders {
    console.log("Opening strategies");
    this.printContext(this, context);
    const strategies: Array<Strategy> = [this.timing, this.technical];

    let purchaseorders: PurchaseOrders = [];
    for (const strategy of strategies) {
      purchaseorders = strategy.open(context);
      Object.assign(context, { purchaseorders });
      this.printContext(strategy, context);
      if (purchaseorders.length < 1) return [];
    }
    return purchaseorders;
  }
}
