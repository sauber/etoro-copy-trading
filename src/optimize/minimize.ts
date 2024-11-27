/**
 * Create original function
 * Establish parameters with bounds
 * iterate
 *   run batch
 *   find gradients
 *   update parameters
 * until gradients are close to 0
 *   or loss is minimized
 */

import { Parameter, Parameters } from "📚/optimize/parameter.ts";

type Input = [number, number];
type Output = number;
type Fn = (input: Input) => Output;

function parameters(): Parameters {
  return [
    new Parameter(-5, 5),
    new Parameter(-5, 5),
  ];
}

// f(x,y) = sin(x)*cos(y) + sqrt(abs(x-y))
// 4 difference minimas at aprox (-4,-4), (-1,-1), (2,2), (5,5)
function source(): (input: Input) => Output {
  return (input) =>
    // Math.sin(input[0]) * Math.cos(input[1]) +
    // Math.sqrt(0.1+Math.abs(input[0] - input[1]));
    input[0] *input[0] + input[1]*input[1]
}

function batch(params: Parameters, fn: Fn, iterations: number): void {
  for (let i = 0; i < iterations; i++) {
    const input: Input = params.map((p) => p.suggest()) as Input;
    const output: Output = fn(input);
    params.forEach((p, index) => p.learn(input[index], output));
  }
}

function step(params: Parameters, fn: Fn): void {
  batch(params, fn, 2);
  params.forEach((p) => p.update());
  const input: Input = params.map((p) => p.value) as Input;
  const output: Output = fn(input);
  console.log(input, "=>", output);
}

function run(params: Parameters, fn: Fn): void {
  for (let i = 0; i < 100; i++) step(params, fn);
}

run(parameters(), source());
