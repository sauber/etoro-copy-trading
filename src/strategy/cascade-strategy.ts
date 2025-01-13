import {
  CloseOrders,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { DateFormat, nextDate, today, weekdayFromDate } from "📚/time/mod.ts";

/** Filter close and open orders through strategies as long as thare stil any orders left */
export class CascadeStrategy implements Strategy {
  constructor(private readonly strategies: Strategy[]) {}

  /** Print out context of Context */
  private printContext(strategy: Strategy, context: StrategyContext): void {
    const date: DateFormat = nextDate(today(), -context.bar);
    console.log(strategy.constructor.name);
    console.log("  Bar:", context.bar, "Date:", weekdayFromDate(date), date);
    console.log("  Value:", context.value, "Amount:", context.amount);
    console.log("  Positions:", context.closeorders.length);
    console.log("  POs:", context.purchaseorders.length);
  }

  public close(context: StrategyContext): CloseOrders {
    // console.log("Closing strategies");
    // this.printContext(this, context);
    // throw "Printing Context";

    let closeorders: CloseOrders = [];
    for (const strategy of this.strategies) {
      closeorders = strategy.close(context);
      Object.assign(context, { closeorders });
      // this.printContext(strategy, context);
      if (closeorders.length < 1) return [];
    }
    return closeorders;
  }

  public open(context: StrategyContext): PurchaseOrders {
    // console.log("Opening strategies");
    // this.printContext(this, context);
    // throw "Printing Context";

    let purchaseorders: PurchaseOrders = [];
    for (const strategy of this.strategies) {
      purchaseorders = strategy.open(context);
      Object.assign(context, { purchaseorders });
      // this.printContext(strategy, context);
      if (purchaseorders.length < 1) return [];
    }
    return purchaseorders;
  }
}
