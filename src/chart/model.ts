import { Bar, Instrument, Series } from "@sauber/backtest";
import { Network, NetworkData, Train } from "@sauber/neurons";
import { Asset, Backend } from "@sauber/journal";
import { Samples } from "./samples.ts";
import { Investors } from "../community/mod.ts";
import { Features } from "./features.ts";
import { Frame, Heatmap, type Points } from "@sauber/widgets";
import { correlation } from "@sauber/statistics";

export class Model {
  /** Repository file name */
  public static readonly assetName = "chart.network";

  /** Number of bars required for prediction */
  public static input_bars: number = 100;

  /** Number of bars required for training */
  public static output_bars: number = 100;

  /** Number of bars between input data and prediction bar */
  public static gap_bars: number = 2;

  constructor(private readonly network: Network) {}

  // Initiate a new neural network with random weights
  static generate(): Model {
    const inputs: number = Model.input_bars;
    const network = new Network(inputs)
      .dense(inputs).lrelu
      // .dense(inputs).lrelu
      // .dense(20).lrelu
      // .dense(20).lrelu
      .dense(20).lrelu
      // .dense(3).lrelu
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
    return this.network.predict(
      new Features(
        instrument,
        Model.input_bars,
        Model.gap_bars,
        0,
        bar,
      ).input,
    )[0];
  }

  /** Improve model by training from set of investors */
  public train(
    investors: Investors,
    epochs: number = 1000,
    batchsize: number = 32,
    callback: (iteration: number, loss: number[]) => void = () => {},
  ): number[] {
    // Feature factory
    const f = new Samples(
      investors,
      Model.input_bars, // Need extra bar to calculate change from previous bar
      Model.output_bars,
      Model.gap_bars,
    );

    // History of losses
    const losses: number[] = [];

    // Train one new natch at a time
    for (let i = 0; i < epochs; i++) {
      // New samples at every training step
      const samples: Features[] = f.samples(batchsize);
      const xs = samples.map((s) => s.input);
      const ys = samples.map((s) => s.output);
      const train = new Train(this.network, xs, ys);
      // train.callback = callback;
      train.run(1, 0.01);
      const loss = train.loss;
      losses.push(loss);
      callback(i + 1, losses);
    }
    return losses;
  }

  /** Comparison of predicted and actual outpus */
  public validation(investors: Investors, count: number): void {
    // Feature factory
    // TODO: Global object property
    const f = new Samples(
      investors,
      Model.input_bars, // Need extra bar to calculate change from previous bar
      Model.output_bars,
      Model.gap_bars,
    );

    const samples: Features[] = f.samples(count);
    const results: Points = [];
    samples.forEach((s: Features) => {
      const [input, prediction, actual] = [
        s.input,
        Number(this.predict(s.instrument, s.end).toPrecision(3)),
        Number(s.output[0].toPrecision(3)),
      ];
      const error = Number((Math.abs(prediction - actual)).toPrecision(3));
      // console.log({
      //   // input,
      //   actual,
      //   prediction,
      //   error,
      // });
      results.push([actual, prediction, 1]);
    });

    // Display a heatmap of actual and predicted values
    const scatter = new Heatmap(results, 60, 12);
    const frame = new Frame(scatter, "x=Actual, y=Prediction");
    console.log(frame.toString());

    // Calculate the correlation score
    const r: number = correlation(
      results.map((r) => r[0]),
      results.map((r) => r[1]),
    );
    console.log("Correlation: " + r.toPrecision(3));
  }
}
