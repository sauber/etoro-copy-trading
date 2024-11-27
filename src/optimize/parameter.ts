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
  // console.log("slope", samples, gradient);
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
    // const update = mHat / (Math.sqrt(vHat) + this.epsilon);
    // console.log("adam", {
    //   i: this.iteration,
    //   g: grad,
    //   m: this.m,
    //   v: this.v,
    //   mHat,
    //   vHat,
    //   u: update,
    // });
    return -update;
  }
}

export class Parameter {
  private readonly optimizer = new AdamOptimizer();

  // Current float value of parameter
  private _value: number;

  // Samples of results
  private readonly samples: Samples = [];

  constructor(
    private readonly min: number,
    private readonly max: number,
    private readonly label: string = "",
  ) {
    // this._value = min + Math.random() * (max - min);
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

  /** Suggest a value close to current value */
  public suggest(): number {
    const width = (this.max - this.min) / 1000;
    const value = this._value - width / 2 + Math.random() * width;
    // console.log("suggest", this._value, this.min, this.max, width, value);
    if (value > this.max) return 2*this.max - value; // Bounce from max
    else if (value < this.min) return 2*this.min - value; // Bounce from min
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
    // console.log("Slope at", this._value, "=", gr);
    return gr;
  }

  /** Adjust value according to gradient */
  public update(): void {
    const grad = this.gradient;
    const update = this.optimizer.optimize(grad);
    this._value += update;
    if (this._value < this.min) this._value = this.min;
    if (this._value > this.max) this._value = this.max;
    this.samples.length = 0;
  }

  // Pretty print value and gradient
  public print(): string {
    return `${this.label}: v=${this._value.toFixed(4)} g=${this.gradient.toFixed(4)}`;
  }
}

export type Parameters = Array<Parameter>;
