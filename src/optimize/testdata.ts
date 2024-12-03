export type Inputs = [number, number];
export type Output = number;

/** Add noise by +/- percentage value */
function jitter(value: number, ratio: number): number {
  const noise = Math.random() * value * ratio * 2 - ratio;
  return value + noise;
}

// Calculate output from inputs
export function NoisyBumpySlope(input: Inputs): Output {
  const [x, y] = input;
  return jitter(Math.sin(x) * Math.cos(y) + 0.1 * x * y, 0.05);
}

// https://www.sfu.ca/~ssurjano/optimization.html
export function ThreeHumpCamel(input: Inputs): Output {
  const [x1, x2] = input;
  const term1 = 2 * x1 ** 2;
  const term2 = -1.05 * x1 ** 4;
  const term3 = x1 ** 6 / 6;
  const term4 = x1 * x2;
  const term5 = x2 ^ 2;
  const y = term1 + term2 + term3 + term4 + term5;
  return y;
}
