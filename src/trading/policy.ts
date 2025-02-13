import {
  CloseOrders,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { Classifier } from "📚/trading/classifier.ts";
import { Rater } from "📚/trading/raters.ts";

export class Policy implements Strategy {
  constructor(
    private readonly ranker: Rater,
    private readonly timer: Rater,
    private readonly positionSize: number,
  ) {}

  public close(context: StrategyContext): CloseOrders {
    // const value: number = context.closeorders.reduce(
    //   (sum, co) => sum + co.position.value(context.bar),
    //   0,
    // );
    // console.log(
    //   "Close bar",
    //   context.bar,
    //   "Invested",
    //   value.toFixed(2),
    //   "Open",
    //   context.closeorders.length,
    //   "Available",
    //   context.purchaseorders.length,
    // );

    const classifier = new Classifier(
      context,
      this.ranker,
      this.timer,
      this.positionSize,
    );

    // const records = classifier.records;
    // const df = DataFrame.fromRecords(records);
    // df
    //   .select(r => r["Action"] != undefined)
    //   .sort("Timing", false)
    //   .sort("Rank", false)
    //   .sort("Value")
    //   .sort("Sell")
    //   .sort("Buy", false)
    //   .digits(2)
    //   .print("Candidates");

    const cos: CloseOrders = classifier.close();
    return cos;
  }

  public open(context: StrategyContext): PurchaseOrders {
    const value: number = context.closeorders.reduce(
      (sum, co) => sum + co.position.value(context.bar),
      0,
    );
    // console.log(
    //   "Open bar",
    //   context.bar,
    //   "Invested",
    //   value.toFixed(2),
    //   "Open",
    //   context.closeorders.length,
    //   "Available",
    //   context.purchaseorders.length,
    // );

    const classifier = new Classifier(
      context,
      this.ranker,
      this.timer,
      this.positionSize,
    );

    // const records = classifier.records;
    // const df = DataFrame.fromRecords(records);
    // df
    //   .sort("Timing", false)
    //   .sort("Rank", false)
    //   .sort("Value")
    //   .sort("Sell")
    //   .sort("Buy", false)
    //   .digits(2)
    //   .print("Candidates");
    // console.log("Position Size", this.positionSize);
    // Deno.exit(143);

    const pos: PurchaseOrders = classifier.open();
    // console.log(barToDate(context.bar), "open", context.purchaseorders.length, "+",  pos.length);
    return pos;
  }
}
