import { Parameters } from "📚/optimize/parameter.ts";
import { sum } from "📚/math/statistics.ts";

type Inputs = Array<number>;
type Output = number;

export class Minimize {
  /** Set of parameters to optimize */
  public readonly parameters: Parameters = [];

  /** Loss function */
  public readonly loss: (inputs: Inputs) => number = () => 0;

  /** Max number of epochs */
  public readonly epochs: number = 0;

  /** Callback status function */
  public readonly status: (
    iteration: number,
    inputs: Inputs,
    output: Output,
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

  private step(): number {
    // Take samples to calculate gradients
    for (let i = 0; i < this.batchSize; i++) {
      const inputs = this.parameters.map((p) => p.suggest()) as Inputs;
      const output: Output = this.loss(inputs);
      this.parameters.forEach((p, index) => p.learn(inputs[index], output));
    }

    // Total of gradients (before value update)
    const momentum = sum(this.parameters.map((p) => Math.abs(p.gradient)));

    // Update parameters
    if (momentum > this.epsilon) this.parameters.forEach((p) => p.update());

    return momentum;
  }

  /** Iterate until momentum under epsilon or max iterations */
  public run(): void {
    for (let i = 0; i < this.epochs; i++) {
      const momentum = this.step();
      const inputs = this.parameters.map((p) => p.value) as Inputs;
      const output: Output = this.loss(inputs);
      if (i % this.every == 0) this.status(i, inputs, momentum);
      if (momentum < this.epsilon) break;
    }
  }
}
