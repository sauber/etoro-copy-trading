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

  /** Only close on specific day of week */
  public close(context: StrategyContext): CloseOrders {
    return this.trading(context.bar) ? context.closeorders : [];
  }

  /** Only open on specific day of week */
  public open(context: StrategyContext): PurchaseOrders {
    return this.trading(context.bar) ? context.purchaseorders : [];
  }
}
