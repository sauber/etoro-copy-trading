import { Bar, Instrument, Series } from "@sauber/backtest";
import { Network, NetworkData, Train } from "@sauber/neurons";
import { Asset, Backend } from "@sauber/journal";
import { Features, Samples } from "./features.ts";

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
    const network = new Network(inputs)
      // .dense(inputs * 2).lrelu
      // .dense(inputs).lrelu
      .dense(3).lrelu
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

  /** Convert a series of absolute prices into a series of percent change since previous day */
  private static change(series: Series): Series {
    return series.map((value, index) => {
      if (index === 0) return 0;
      return (value - series[index - 1]) / series[index - 1];
    }).slice(1);
  }

  /** Signal value at bar */
  public predict(instrument: Instrument, bar: Bar): number {
    const start_bar = bar + Model.input_bars + Model.gap_bars;
    const end_bar = bar + Model.gap_bars;
    const past: Instrument = instrument.slice(start_bar, end_bar);
    const input: Series = past.series;
    // TODO: Convert absolute prices to %change
    const changes: Series = Model.change(input);
    const output: number = this.network.predict(Array.from(changes))[0];
    return output;
  }

  public train(
    investors: Instrument[],
    epochs: number = 1000,
    batchsize: number = 32,
  ): number[] {
    // Feature factory
    const f = new Features(
      investors,
      Model.input_bars + 1, // Need extra bar to calculate change from previous bar
      Model.output_bars,
      Model.gap_bars,
    );

    // History of losses
    const losses: number[] = [];

    // Train one new natch at a time
    for (let i = 0; i < epochs; i++) {
      // New samples at every training step
      const samples: Samples = f.samples(batchsize);
      // console.log(samples);
      // Deno.exit(143);
      const xs = samples.map((s) => Array.from(Model.change(s[0])));
      const ys = samples.map((s) => [s[1]]);
      const train = new Train(this.network, xs, ys);
      train.run(1, 0.001);
      const loss = train.loss;
      losses.push(loss);
      // console.log(`Iteration ${i} Loss: ${loss}`);
    }
    return losses;
  }
}
