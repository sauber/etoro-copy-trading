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

  /** Sort each positions into one of these categories:
   *
   * Sell Opportunity: Close now to take profit
   * Buy opportunity: Increase position if instrument is desired and under-invested
   * Keep
   */
  private close_classification(
    context: StrategyContext,
  ): [CloseOrders, CloseOrders, CloseOrders] {
    const close: CloseOrders = [];
    const increase: CloseOrders = [];
    const keep: CloseOrders = [];
    const targetAmount = context.value * this.position_size;

    for (const co of context.closeorders) {
      // Candidates for taking profit
      const timing = this.timing(co.position.instrument, context.bar);
      if (timing >= this.sell_threshold) {
        close.push(co);
        continue;
      }

      // Candidates to increase position size
      if (timing <= this.buy_threshold) {
        const gap = targetAmount - co.position.amount;
        if (gap > 0) {
          const confidence = this.confidence(
            co.position.instrument,
            context.bar,
          );
          if (confidence && confidence > 0) {
            increase.push(co);
            continue;
          }
        }
      }

      // Candidates to keep unchanged
      keep.push(co);
    }

    return [close, increase, keep];
  }

  /** Sort each instrument into one of these categories:
   * - Open: Open new position
   * - Increase: Increase size of existing position
   * - Pass: Instrument is not desired
   */
  private open_classification(
    context: StrategyContext,
  ): [PurchaseOrders, PurchaseOrders, PurchaseOrders] {
    const open: PurchaseOrders = [];
    const increase: PurchaseOrders = [];
    const pass: PurchaseOrders = [];
    const targetAmount = context.value * this.position_size;

    for (const po of context.purchaseorders) {
      const timing = this.timing(po.instrument, context.bar);
      const confidence = this.confidence(po.instrument, context.bar);

      // Desirable position
      if (timing <= this.buy_threshold && confidence && confidence > 0) {
        // TODO: Is it ok to compare instrument, or is it necessary to compare symbol instead?
        const existing = context.closeorders.find((co: CloseOrder) =>
          co.position.instrument === po.instrument
        );
        if (existing) {
          const gap = targetAmount - existing.position.amount;
          if (gap > 0) {
            increase.push(po);
            continue;
          }
        } else {
          open.push(po);
          continue;
        }
      }

      pass.push(po);
    }
    return [open, increase, pass];
  }

  /** List of open positions that should closed when the time is right */
  private open_keep(context: StrategyContext): CloseOrders {
    return context.closeorders.filter((co: CloseOrder) =>
      this.timing(co.position.instrument, context.bar) < this.sell_threshold
    )
      .filter((co: CloseOrder) => {
        this.confidence(co.position.instrument, context.bar) !== undefined;
      });
  }

  // Indentify positions that are
  // - Open, and want to close
  // - Open, and don't want to close (yet)
  // - Open, and want to increase
  // - New not yet open

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
