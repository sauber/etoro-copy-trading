import {
  Bar,
  CloseOrders,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { type DateFormat, nextDate, today } from "@sauber/dates";

/** Only trade on certain day of week */
export class WeekdayStrategy implements Strategy {
  constructor(private readonly weekday: number) {}

  private trading(bar: Bar): boolean {
    const date: DateFormat = nextDate(today(), -bar);
    const weekday: number = new Date(date).getDay();
    return this.weekday === weekday;
  }

  public close(context: StrategyContext): CloseOrders {
    return this.trading(context.bar) ? context.closeorders : [];
  }

  public open(context: StrategyContext): PurchaseOrders {
    return this.trading(context.bar) ? context.purchaseorders : [];
  }
}
