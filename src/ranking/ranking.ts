import { Network, NetworkData } from "@sauber/neurons";
import { Investor } from "📚/investor/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { Asset, Backend } from "📚/storage/mod.ts";

import { Model } from "📚/ranking/model.ts";
import { Features } from "📚/ranking/features.ts";
import { type Input, input_labels, type Output } from "📚/ranking/types.ts";

export class Ranking {
  public static readonly assetName = "ranking.network";

  constructor(private readonly model: Model) {}

  /** Load from repository or generate Ranking model if missing */
  public static async load(repo: Backend): Promise<Ranking> {
    const asset = new Asset<NetworkData>(Ranking.assetName, repo);
    const model: Model = (await asset.exists())
      ? new Model(Network.import(await asset.retrieve()))
      : Model.generate(input_labels.length);
    return new Ranking(model);
  }

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
