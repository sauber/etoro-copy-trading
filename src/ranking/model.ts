import { Network, Train } from "@sauber/neurons";
import type { NetworkData } from "@sauber/neurons";
import { mse } from "@sauber/statistics";
import type { Input, Inputs, Output, Outputs } from "📚/ranking/types.ts";

type TrainResults = {
  iterations: number;
  loss: number;
};

export type Dashboard = (x: number, y: number[]) => void;

/** Generate and train a neural network model */
export class Model {
  constructor(private readonly network: Network) {}

  /** Generate new model with random parameters */
  public static generate(inputs: number) {
    const hidden: number = Math.round(inputs * 1.5);
    const network = new Network(inputs)
      .normalize
      .simple.lrelu
      .dense(3).lrelu
      .dense(1);
    return new Model(network);
  }

  /** Generate model from save parameters */
  public static import(data: NetworkData) {
    const network = Network.import(data);
    return new Model(network);
  }

  /** Export parameters of model */
  public export(): NetworkData {
    return this.network.export;
  }

  /** Adjust parameters in model by iterating training sets */
  public train(
    inputs: Inputs,
    outputs: Outputs,
    max_iterations: number = 20000,
    learning_rate: number = 0.001,
    batch_size: number = 32,
    callback?: Dashboard,
  ): TrainResults {
    const xs = inputs.map((record) => Object.values(record));
    const ys = outputs.map((record) => [record]);

    this.network.adapt(xs);
    const train = new Train(this.network, xs, ys);
    if (callback) train.callback = callback;
    console.log("batch_size", batch_size);
    train.batchSize = batch_size;
    train.callbackFrequency = 10;
    const iterations: number = train.run(max_iterations, learning_rate);
    return { iterations, loss: train.loss };
  }

  /** Forward inference of an input set */
  public predict(input: Input): Output {
    const x: number[] = Object.values(input);
    const result = this.network.predict(x);
    return result[0] as Output;
  }

  /** Validate accuracy of model based on inputs and outputs. Higher number is higher error. */
  public validate(
    inputs: Inputs,
    outputs: Outputs,
  ): number {
    const xs: number[][] = inputs.map((record) => Object.values(record));
    const results: Outputs = xs.map((x) => this.network.predict(x)[0]);
    const error: number = mse(outputs, results);
    return error;
  }
}
