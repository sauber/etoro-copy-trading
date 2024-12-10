import { Model } from "./model.ts";
import { Features } from "./features.ts";

export class Ranking {
  constructor(private readonly model: Model) {}

  /** Predicted future SharpeRatio for an investor */
  public predict(
    investor: Investor,
    date?: DateFormat,
  ): number {
    const input: Input = new Features(investor).input(date);
    const prediction: Output = this.model.predict(input);
    return prediction.SharpeRatio;
  }
}
