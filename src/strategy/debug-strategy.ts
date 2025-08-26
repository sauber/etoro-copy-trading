import {
  CloseOrders,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { barToDate } from "@sauber/dates";

/** Print debug information */
export class DebugStrategy implements Strategy {
  public open(context: StrategyContext): PurchaseOrders {
    console.log(
      "Debug",
      context.bar,
      barToDate(context.bar),
      "open",
      context.purchaseorders.length,
    );
    return context.purchaseorders;
  }

  public close(context: StrategyContext): CloseOrders {
    console.log(
      "Debug",
      context.bar,
      barToDate(context.bar),
      "close",
      context.closeorders.length,
      context.closeorders.map(
        (
          co,
        ) => [
          co.position.instrument.symbol,
          co.position.value(context.bar).toFixed(2),
          co.position.id,
        ],
      ),
    );
    return context.closeorders;
  }
}
