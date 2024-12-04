import { Parameters } from "📚/optimize/parameter.ts";
import { sum } from "📚/math/statistics.ts";

type Inputs = Array<number>;
type Output = number;

export class Minimize {
  /** Set of parameters to optimize */
  public readonly parameters: Parameters = [];

  /** Function calculating output from parameters */
  public readonly fn: (inputs: Inputs) => number = () => 0;

  /** Max number of epochs */
  public readonly epochs: number = 1000;

  /** Callback status function */
  public readonly status: (
    iteration: number,
    inputs: Inputs,
    output: Output,
    momentum: number,
  ) => void = () => undefined;

  /** Frequency of callback */
  public readonly every: number = 0;

  /** Stop when sum of gradients is less */
  public readonly epsilon: number = 1;

  /** Count of sample to calculate gradient */
  public readonly batchSize: number = 2;

  constructor(params: Partial<Minimize> = {}) {
    Object.assign(this, params);
  }

  /** Run samples to have data available for finding gradients */
  private gradients(): void {
    for (let i = 0; i < this.batchSize; i++) {
      const inputs = this.parameters.map((p) => p.suggest()) as Inputs;
      const output: Output = this.fn(inputs);
      this.parameters.forEach((p, index) => p.learn(inputs[index], output));
    }
  }

  private step(): number {
    // Update parameters
    this.gradients();
    this.parameters.forEach((p) => p.update());

    // Total of gradients (before value update)
    const momentum = Math.sqrt(sum(this.parameters.map((p) => p.changed ** 2)));
    return momentum;
  }

  /** Iterate until momentum under epsilon or max iterations */
  public run(): number {
    let i = 0;
    for (; i <= this.epochs; ++i) {
      const momentum = this.step();
      const inputs = this.parameters.map((p) => p.value) as Inputs;
      const output: Output = this.fn(inputs);
      if (momentum < this.epsilon) {
        this.status(i, inputs, output, momentum);
        break;
      } else if (i % this.every == 0) this.status(i, inputs, output, momentum);
    }
    return i;
  }
}
