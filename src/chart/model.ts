import { Bar, Instrument } from "@sauber/backtest";
import { Network, NetworkData } from "@sauber/neurons";
import { Asset, Backend } from "@sauber/journal";

export class Model {
  /** Repository file name */
  public static readonly assetName = "chart.network";

  /** Number of bars required for prediction */
  private static input_bars: number = 14;

  /** Number of bars required for training */
  private static output_bars: number = 100;

  /** Number of bars between input data and prediction bar */
  private static gap_bars: number = 2;

  constructor(private readonly network: Network) {}

  // Initiate a new neural network with random weights
  static generate(): Model {
    const inputs: number = Model.input_bars;
    const network = new Network(inputs).dense(inputs).relu.dense(inputs).relu
      .dense(1);
    return new Model(network);
  }

  /** Storable asset object */
  static asset(repo: Backend): Asset<NetworkData> {
    return new Asset<NetworkData>(Model.assetName, repo);
  }

  /** Load model from repository */
  static async load(repo: Backend): Promise<Model | false> {
    const asset = Model.asset(repo);
    if (!await asset.exists()) return false;
    const network = Network.import(await asset.retrieve());
    return new Model(network);
  }

  /** Save model to repository */
  public save(repo: Backend): Promise<void> {
    return Model.asset(repo).store(this.network.export);
  }

  /** Signal value at bar */
  // public predict(instrument: Instrument, bar: Bar): number {
  //   const chart: Series = instrument.series;
  //   // const start_index
  //   // const chart: Instrument = this.model.generate(instrument);
  //   return chart.price(bar);
  // }
}
