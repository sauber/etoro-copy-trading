import { Investor } from "📚/investor/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";

import { Model } from "📚/ranking/model.ts";
import { Features } from "📚/ranking/features.ts";
import type { Input, Output } from "📚/ranking/types.ts";

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
