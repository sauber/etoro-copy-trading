/** Stochastic Gradient Descent */

type Numbers = Array<number>;

/** Sum of values */
export function sum(values: Numbers): number {
  return values.reduce((total: number, a: number) => total + a, 0);
}

/** a*x^2 + b*x + c */
function pol2([a, b, c]: Numbers, x: number): number {
  return a * x * x + b * x + c;
}

/** The error from fn() */
function loss([a, b, c]: Numbers, x: number, y: number): number {
  return y - pol2([a, b, c], x);
}

function sqd(
  coeffcients: Numbers,
  x: Numbers,
  y: Numbers,
  learning_rate: number,
  loss: Function,
): Numbers {
  const residuals = x.map((x, i) => loss(coeffcients, x, y[i]));
  console.log({ coeffcients, x, y, learning_rate, loss, residuals });
  return coeffcients;
}

// Training data
const y = [40, 42, 44, 40, 38, 42, 45, 48, 50];
const x = [...Array(y.length).keys()];

// Initial parameters
const params = [Math.random(), Math.random(), Math.random()];
const learning_rate = 0.01;
sqd(params, x, y, learning_rate, loss);
