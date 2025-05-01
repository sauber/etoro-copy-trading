import { Parameters } from "📚/optimize/parameter.ts";
import { sum } from "📚/math/statistics.ts";
import { Inputs, Output, Status } from "📚/optimize/types.d.ts";

export abstract class Optimizer {
  /** Set of parameters to optimize */
  public readonly parameters: Parameters = [];

  /** Function calculating output from parameters */
  public readonly agent: (inputs: Inputs) => number = () => 0;

  /** Max number of epochs */
  public readonly epochs: number = 1000;

  /** Callback status function */
  public readonly status: Status = () => undefined;

  /** Frequency of callback */
  public readonly every: number = 0;

  /** Stop when sum of gradients is less */
  public readonly epsilon: number = 1;

  /** Count of samples to calculate gradient */
  public readonly batchSize: number = 16;

  /** History of loss */
  protected history: Array<Output> = [];

  /** Direction for learning (+1 for maximize, -1 for minimize) */
  protected abstract direction: number;

  constructor(params: Partial<Optimizer> = {}) {
    Object.assign(this, params);
  }

  /** Run samples to have data available for finding gradients */
  private gradients(): void {
    for (let i = 0; i < this.batchSize; i++) {
      const inputs: Inputs = this.parameters.map((p) => p.suggest());
      const loss: Output = this.agent(inputs);
      this.parameters.forEach((p, index) => p.learn(inputs[index], this.direction * loss));
    }
  }

  /** Run one cycle of adjusting parameter values */
  private step(): number {
    // Update parameters
    this.gradients();
    this.parameters.forEach((p) => p.update());

    // Calculate current loss
    const best: Inputs = this.parameters.map((p) => p.value);
    const loss: Output = this.agent(best);
    this.history.push(loss);

    // Total of gradients (before value update)
    const momentum = Math.sqrt(sum(this.parameters.map((p) => p.changed ** 2)));
    return momentum;
  }

  /** Iterate until momentum under epsilon or max iterations */
  public run(): number {
    let i = 1;
    for (; i <= this.epochs; ++i) {
      const momentum = this.step();
      if (momentum < this.epsilon) {
        this.status(i, momentum, this.parameters, this.history);
        i++;
        break;
      } else if (i % this.every == 0) {
        this.status(i, momentum, this.parameters, this.history);
      }
    }
    return i - 1;
  }
}