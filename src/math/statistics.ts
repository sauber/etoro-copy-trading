type Numbers = Array<number>;

/** Add all numbers together */
export function sum(values: Numbers): number {
  return values.reduce((total: number, a: number) => total + a, 0);
}

/** Average of numbers */
export function avg(values: Numbers): number {
  return sum(values) / values.length;
}

/** Add a constant value to each number */
export function add(values: Numbers, offset: number): Numbers {
  return values.map((x) => x + offset);
}

/** Raise each value to power */
export function pow(values: Numbers, exponent: number): Numbers {
  return values.map((x) => Math.pow(x, exponent));
}

/** number * number */
export function squared(values: Numbers): Numbers {
  return values.map((x) => x * x);
}

/** Standard Deviation */
export function std(values: Numbers): number {
  const mean: number = avg(values);
  const variances: Numbers = add(values, -mean);
  const sq: Numbers = squared(variances);
  const total: number = sum(sq);
  const result: number = Math.sqrt(total / (values.length - 1));
  return result;
}

/** Linear regression coeeficents */
export function regression(
  values: Numbers,
): { intercept: number; gradiant: number } {
  const sum = [0, 0, 0, 0];
  values.forEach(function (value, index) {
    sum[0] += index;
    sum[1] += value;
    sum[2] += index * index;
    sum[3] += index * value;
  });
  const len = values.length;

  const run: number = len * sum[2] - sum[0] * sum[0];
  const rise: number = len * sum[3] - sum[0] * sum[1];
  const gradiant: number = run === 0 ? 0 : rise / run;
  const intercept: number = sum[1] / len - gradiant * sum[0] / len;

  return { intercept: intercept, gradiant: gradiant };
}
