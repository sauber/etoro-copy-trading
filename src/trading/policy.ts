import {
  CloseOrders,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { Classifier, Rater } from "📚/trading/classifier.ts";

export class Policy implements Strategy {
  constructor(
    private readonly ranker: Rater,
    private readonly timer: Rater,
    private readonly positionSize: number,
  ) {}

  public close(context: StrategyContext): CloseOrders {
    const classifier = new Classifier(
      context,
      this.ranker,
      this.timer,
      this.positionSize,
    );
    const cos: CloseOrders = classifier.close();
    return cos;
  }

  public open(context: StrategyContext): PurchaseOrders {
    const classifier = new Classifier(
      context,
      this.ranker,
      this.timer,
      this.positionSize,
    );
    const pos: PurchaseOrders = classifier.open();
    return pos;
  }
}
