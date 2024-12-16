import {
  Bar,
  Positions,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { DateFormat, nextDate, today } from "📚/time/mod.ts";

/** Only trade on certain day of week */
export class WeekdayStrategy implements Strategy {
  constructor(private readonly weekday: number) {}

  private trading(bar: Bar): boolean {
    const date: DateFormat = nextDate(today(), -bar);
    const weekday: number = new Date(date).getDay();
    return this.weekday === weekday;
  }

  public close(context: StrategyContext): Positions {
    return this.trading(context.bar) ? context.positions : [];
  }

  public open(context: StrategyContext): PurchaseOrders {
    return this.trading(context.bar) ? context.purchaseorders : [];
  }
}
