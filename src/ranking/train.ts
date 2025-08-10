import { DataFrame } from "@sauber/dataframe";
import { Dashboard, type Predict } from "@sauber/ml-cli-dashboard";
import { avg } from "@sauber/statistics";
import { Model } from "📚/ranking/model.ts";
import { Investors } from "📚/community/mod.ts";
import { TrainingData } from "📚/ranking/trainingdata.ts";
import type { Input, Inputs, Outputs } from "📚/ranking/types.ts";

// Dashboard size
const WIDTH = 78;
const HEIGHT = 12;

// Identify top two input columns correlated to output
function correlations(inputs: DataFrame, outputs: DataFrame): [string, string] {
  const correlations: DataFrame = inputs
    .correlationMatrix(outputs)
    .amend("abs", (r) => Math.abs(r.Score as number))
    .sort("abs")
    .reverse;
  correlations.slice(0, 10).digits(4).print("Correlations");
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

  // Pick samples for overlay
  const samples: DataFrame = data.shuffle.slice(0, overlay_count).outlier(2);
  const overlay: Array<Point> = samples.records.map((r) =>
    [r[xlabel], r[ylabel]] as Point
  );
  const out: number[] = samples.records.map((r) => r.Score as number);

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

////////////////////////////////////////////////////////////////////////

/** Train Ranking model with Training data */
export class Train {
  /** Minimum number of future bars after stats */
  // 15 for testdata, 180 for real data
  public readonly bar_count: number = 180;

  /** Maximum number fo training iterations */
  public readonly epochs: number = 2000;

  /** Model learning rate */
  public readonly learning_rate: number = 0.001;

  /** Number of samples for stochastic gradient descent */
  public readonly batch_size: number = 200;

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
  public trainingdata(): DataFrame {
    if (!this._data) {
      this._data = new TrainingData(this.bar_count).generate(this.investors);
    }
    return this._data;
  }

  /** Mean value for each input column */
  private means(): Input {
    const inputs: DataFrame = this.trainingdata().exclude(["Score"]);

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
    const inputs: DataFrame = data.exclude(["Score"]);
    const outputs: DataFrame = data.include(["Score"]);
    const labels = correlations(inputs, outputs) as [keyof Input, keyof Input];
    console.log({ labels });

    // Callback to model from dashboard
    const predict = (a: number, b: number): number => {
      means[labels[0]] = a;
      means[labels[1]] = b;
      return this.model.predict(means);
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
    const inputs: Inputs = data.exclude(["Score"]).records as Inputs;
    const outputs: Outputs = data.values("Score");

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
      inputs,
      outputs,
      iterations,
      this.learning_rate,
      this.batch_size,
      status,
    );

    if (dashboard) console.log(dashboard.finish());
    return results.iterations;
  }

  /** Confirm accuracy of model */
  public validate(): number {
    const data: DataFrame = this.trainingdata();
    const inputs: Inputs = data.exclude(["Score"]).records as Inputs;
    const outputs: Outputs = data.values("Score");
    const error: number = this.model.validate(inputs, outputs);
    return error;
  }
}
