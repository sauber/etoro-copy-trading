import { randn } from "jsr:@sauber/statistics";

type Sample = [number, number];
type Samples = Array<Sample>;

/** Estimate slope by linear regression */
function slope(samples: Samples): number {
  const sum = [0, 0, 0, 0];
  samples.forEach((v) => {
    sum[0] += v[0];
    sum[1] += v[1];
    sum[2] += v[0] * v[0];
    sum[3] += v[0] * v[1];
  });
  const len = samples.length;
  const run: number = len * sum[2] - sum[0] * sum[0];
  const rise: number = len * sum[3] - sum[0] * sum[1];
  const gradient: number = run === 0 ? 0 : rise / run;
  return gradient;
}

class AdamOptimizer {
  private readonly learningRate = 0.1;
  private readonly beta1 = 0.9;
  private readonly beta2 = 0.99;
  private readonly epsilon = 1e-8;
  private m = 0;
  private v = 0;
  private iteration = 0;

  /** How much to increment param */
  optimize(grad: number): number {
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

export class Parameter {
  private readonly optimizer = new AdamOptimizer();

  // Current float value of parameter
  protected _value: number;

  // Samples of results
  private readonly samples: Samples = [];

  constructor(
    protected readonly min: number,
    protected readonly max: number,
    public readonly label: string = "",
  ) {
    this._value = this.random;
  }

  /** Random number between min and max */
  public get random(): number {
    return this.min + Math.random() * (this.max - this.min);
  }

  /** Public value of parameter */
  public get value(): number {
    return this._value;
  }

  /** Set value  */
  public set(value: number): void {
    this._value = value;
    if (this._value < this.min) this._value = this.min;
    if (this._value > this.max) this._value = this.max;
    this.samples.length = 0;
  }

  /** Suggest a value close to current value */
  public suggest(): number {
    const width = this.max - this.min;
    const value = this._value - width / 2 + randn() * width;
    if (value > this.max) return this.max;
    else if (value < this.min) return this.min;
    else return value;
  }

  /** Using parameter value what was end result */
  public learn(x: number, y: number): void {
    this.samples.push([x, y]);
  }

  /** Gradient of samples */
  public get gradient(): number {
    if (this.samples.length < 2) return 0;
    const gr: number = slope(this.samples);
    return gr;
  }

  /** Adjust value according to gradient */
  public update(): void {
    const grad = this.gradient;
    const update = this.optimizer.optimize(grad);
    this.set(this._value + update);
  }

  // Pretty print value and gradient
  public print(): string {
    const v: number = parseFloat(this.value.toFixed(4));
    const g: number = parseFloat(this.gradient.toFixed(4));
    return `${this.label}: v=${v} g=${g}`;
  }
}

/** Integer Value */
export class IntegerParameter extends Parameter {
  public override get value(): number {
    return Math.round(this._value);
  }

  public override get random(): number {
    return Math.round(this.min + Math.random() * (this.max - this.min));
  }

  /** Value, or one below or one above */
  public override suggest(): number {
    const width = this.max - this.min;
    const value = this._value - width / 2 + randn() * width;
    if (value > this.max) return this.max;
    else if (value < this.min) return this.min;
    else return Math.round(value);
  }
}

export type Parameters = Array<Parameter>;
