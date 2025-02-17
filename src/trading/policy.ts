import {
  Bar,
  CloseOrders,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { Classifier } from "📚/trading/classifier.ts";
import { Rater } from "📚/trading/raters.ts";

export class Policy implements Strategy {
  private bar: Bar | undefined;
  private _classifier: Classifier | undefined;

  constructor(
    private readonly ranker: Rater,
    private readonly timer: Rater,
    private readonly positionSize: number,
  ) {}

  /** Reuse classification for open() and close() at same bar */
  private classifier(context: StrategyContext): Classifier {
    // Previously generate classifier is from same Bar
    if (this.bar == context.bar && this._classifier !== undefined) {
      return this._classifier;
    }

    // Generate new Classifier at bar
    const classifier = new Classifier(
      context,
      this.ranker,
      this.timer,
      this.positionSize,
    );
    this.bar = context.bar;
    this._classifier = classifier;
    return classifier;
  }

  public close(context: StrategyContext): CloseOrders {
    return this.classifier(context).close();
  }

  public open(context: StrategyContext): PurchaseOrders {
    return this.classifier(context).open();
  }
}
