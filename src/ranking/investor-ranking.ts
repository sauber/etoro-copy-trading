import { Network, NetworkData } from "@sauber/neurons";
import { Investor } from "📚/investor/mod.ts";
import { Asset, Backend } from "📚/storage/mod.ts";

import { Model } from "📚/ranking/model.ts";
import { Features } from "📚/ranking/features.ts";
import { type Input, input_labels, type Output } from "📚/ranking/types.ts";
import { Community } from "📚/repository/mod.ts";
import { Train } from "📚/ranking/train.ts";
import { Dashboard } from "@sauber/ml-cli-dashboard";
import { Bar } from "@sauber/backtest";
import { Ranking } from "📚/ranking/mod.ts";

export class InvestorRanking implements Ranking {
  public static readonly assetName = "ranking.network";
  private readonly asset: Asset<NetworkData>;
  public model?: Model;

  // TODO: model should be private
  constructor(private readonly repo: Backend) {
    this.asset = new Asset<NetworkData>(InvestorRanking.assetName, this.repo);
  }

  /** Load from repository or generate Ranking model if missing */
  public async load(): Promise<boolean> {
    if (!await this.asset.exists()) return false;
    this.model = new Model(Network.import(await this.asset.retrieve()));
    return true;
  }

  /** Generate new random model */
  public generate(): this {
    this.model = Model.generate(input_labels.length);
    return this;
  }

  /** Store model to repository */
  public async save(): Promise<void> {
    if (this.model) await this.asset.store(this.model.export());
  }

  /** Predicted future Score for an investor */
  public predict(
    investor: Investor,
    bar: Bar,
  ): number {
    if (!this.model) {
      throw new Error("Error: Model not defined, cannot predict.");
    }
    const input: Input = new Features(investor).input(bar);
    const prediction: Output = this.model.predict(input);
    return prediction;
  }

  public async train(): Promise<number> {
    if (!this.model) throw new Error("Error: Model not defined, cannot train.");
    const community: Community = new Community(this.repo);
    const investors = await community.all();
    const train = new Train(this.model, investors);
    const dashboard: Dashboard = train.dashboard;
    const baseline: number = train.validate();
    train.run(dashboard);
    const results = train.validate();
    const improvement: number = baseline - results;
    console.log(
      "Model error improved from",
      baseline,
      "to",
      results,
      ((baseline - results) / baseline * 100).toPrecision(3) + "%",
    );
    return improvement;
  }
}
