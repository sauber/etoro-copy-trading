import { Optimizer } from "📚/optimize/types.d.ts";

/** Adaptive Moment Estimation */
export class Adam implements Optimizer {
  public readonly learningRate: number = 0.1;
  public readonly beta1: number = 0.9;
  public readonly beta2: number = 0.99;
  public readonly epsilon: number = 1e-8;
  private m = 0;
  private v = 0;
  private iteration = 0;

  constructor(params: Partial<Adam> = {}) {
    Object.assign(this, params);
  }

  /** By how much to increment value */
  update(grad: number): number {
    this.iteration++;

    // Update biased first moment estimate
    this.m = this.beta1 * this.m + (1 - this.beta1) * grad;

    // Update biased second raw moment estimate
    this.v = this.beta2 * this.v + (1 - this.beta2) * grad * grad;

    // Compute bias-corrected first moment estimate
    const mHat = this.m / (1 - Math.pow(this.beta1, this.iteration));

    // Compute bias-corrected second raw moment estimate
    const vHat = this.v / (1 - Math.pow(this.beta2, this.iteration));

    // Update parameter
    const update = this.learningRate * mHat / (Math.sqrt(vHat) + this.epsilon);
    return -update;
  }
}
