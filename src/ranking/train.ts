import { DataFrame } from "@sauber/dataframe";
import { Dashboard, type Predict } from "@sauber/ml-cli-dashboard";
import { avg } from "@sauber/statistics";
import { Model } from "📚/ranking/model.ts";
import { Investors } from "📚/repository/mod.ts";
import { Samples, TrainingData } from "📚/ranking/trainingdata.ts";
import type { Input, Inputs, Outputs } from "📚/ranking/types.ts";

// Dashboard size
const WIDTH = 78;
const HEIGHT = 12;

// Recursively trim training data until no outliers remain
function outlierFilter(data: DataFrame, factor: number = 10): DataFrame {
  const prev: number = data.length;
  data = data.outlier(factor);
  if (data.length != prev) {
    console.log(`Data length trimmed ${prev} to ${data.length}`);
  }
  return (data.length == prev) ? data : outlierFilter(data, factor);
}

// Identify top two input columns correlated to output
function correlations(inputs: DataFrame, outputs: DataFrame): [string, string] {
  const correlations: DataFrame = inputs
    .correlationMatrix(outputs)
    .amend("abs", (r) => Math.abs(r.SharpeRatio as number))
    .sort("abs")
    .reverse;
  const names = correlations.values<string>("Name").slice(0, 2) as [
    string,
    string,
  ];
  return names;
}

// Create dashboard
function createDashboard(
  data: DataFrame,
  predict: Predict,
  xlabel: keyof Input,
  ylabel: keyof Input,
  epochs: number,
  overlay_count: number,
): Dashboard {
  // const epochs = EPOCHS;
  const width = WIDTH;
  const height = HEIGHT;
  type Point = [number, number];

  // Pick max 200 samples for overlay
  const samples: DataFrame = data.shuffle.slice(0, overlay_count);
  const overlay: Array<Point> = samples.records.map((r) =>
    [r[xlabel], r[ylabel]] as Point
  );
  const out: number[] = samples.records.map((r) => r.SharpeRatio as number);

  return new Dashboard(
    width,
    height,
    overlay,
    out,
    predict,
    epochs,
    xlabel,
    ylabel,
  );
}

// Validation of random inputs
function validation(model: Model, data: DataFrame, count: number = 5): void {
  console.log("Validation");
  const samples = data.shuffle.slice(0, count);
  const inputs: Inputs = samples.exclude(["SharpeRatio"]).records as Inputs;
  const outputs: Outputs = samples.include(["SharpeRatio"]).records as Outputs;
  // Compare training output with predicted output
  inputs.forEach((input: Input, sample: number) => {
    console.log("sample");
    console.log("  xs:", input);
    console.log("  ys:", outputs[sample]);
    console.log("  yp:", model.predict(input));
  });
}

////////////////////////////////////////////////////////////////////////

/** Train Ranking model with Training data */
export class Train {
  /** Minimum number of future bars after stats */
  public readonly bar_count: number = 30;

  /** Maximum number fo training iterations */
  public readonly epochs: number = 2000;

  /** Model learning rate */
  public readonly learning_rate: number = 0.001;

  /** Number of samples for stochastic gradient descent */
  public readonly batch_size: number = 64;

  /** Number of samples to overlay in dashboard */
  public readonly overlay_size: number = 200;

  constructor(
    private readonly model: Model,
    private readonly investors: Investors,
    params: Partial<Train> = {},
  ) {
    Object.assign(this, params);
  }

  private _data?: DataFrame;
  private trainingdata(): DataFrame {
    if (!this._data) {
      const td = new TrainingData(this.bar_count);
      const samples: Samples = [];

      for (const investor of this.investors) {
        const features: Samples = td.features(investor);
        // console.log("Investor", investor.UserName, features);
        samples.push(...features);
      }
      const records = samples.map((s) => Object.assign(s.input, s.output));
      // console.log("Records", {records});
      const df = DataFrame.fromRecords(records);
      const trimmed = outlierFilter(df);
      // console.log("Training sample loaded:", trimmed.length);
      this._data = trimmed;
    }
    return this._data;
  }

  /** Mean value for each input column */
  private means(): Input {
    const inputs: DataFrame = this.trainingdata().exclude(["SharpeRatio"]);

    // Mean values
    const colNames = inputs.names as Array<keyof Input>;
    const means: Input = Object.fromEntries(
      colNames.map((
        name: keyof Input,
      ) => [name, avg(this.trainingdata().values(name) as number[])]),
    ) as Input;
    return means;
  }

  /** Create a callback to a dashboard  */
  public get dashboard(): Dashboard {
    const data: DataFrame = this.trainingdata();
    const means: Input = this.means();
    const inputs: DataFrame = data.exclude(["SharpeRatio"]);
    const outputs: DataFrame = data.include(["SharpeRatio"]);
    const labels = correlations(inputs, outputs) as [keyof Input, keyof Input];

    // Callback to model from dashboard
    const predict = (a: number, b: number): number => {
      means[labels[0]] = a;
      means[labels[1]] = b;
      return this.model.predict(means).SharpeRatio;
    };

    const dashboard = createDashboard(
      data,
      predict,
      ...labels,
      this.epochs,
      this.overlay_size,
    );
    return dashboard;
  }

  /** Run training */
  public run(dashboard?: Dashboard): number {
    const data: DataFrame = this.trainingdata();
    const inputs: DataFrame = data.exclude(["SharpeRatio"]);
    const outputs: DataFrame = data.include(["SharpeRatio"]);

    // Callback to dashboard from training
    const status = dashboard
      ? (iteration: number, loss: number[]): void => {
        console.log(dashboard.render(iteration, loss[loss.length - 1]));
      }
      : () => {};

    // Training
    // console.log("Training...");
    const iterations = this.epochs;
    const results = this.model.train(
      inputs.records as Inputs,
      outputs.records as Outputs,
      iterations,
      this.learning_rate,
      this.batch_size,
      status,
    );

    if (dashboard) console.log(dashboard.finish());
    // console.log(results);
    // validation(this.model, data, 5);
    return results.iterations;
  }
}
