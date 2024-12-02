import { assertEquals, assertGreater, assertInstanceOf } from "@std/assert";
import { Dashboard } from "@sauber/ml-cli-dashboard";
import { Minimize } from "📚/optimize/minimize.ts";
import { Parameter } from "📚/optimize/parameter.ts";

Deno.test("Instance", () => {
  const min = new Minimize();
  assertInstanceOf(min, Minimize);
});

Deno.test("Run", () => {
  const min = new Minimize();
  const iterations = min.run();
  assertEquals(iterations, 0);
});

Deno.test("Optimize parameters for minimal loss", { ignore: true }, () => {
  type Inputs = [number, number];
  type Output = number;

  /** Add noise by +/- percentage value */
  function jitter(value: number, ratio: number): number {
    const noise = Math.random() * value * ratio * 2 - ratio;
    return value + noise;
  }

  // Calculate output from inputs
  function NoisyBumpySlope(input: Inputs): Output {
    const [x, y] = input;
    // return jitter(Math.sin(x) * Math.cos(y) + 0.1 * x * y, 0.2);
    return jitter(Math.sin(x) * Math.cos(y) + 0.1 * x * y, 0.05);
  }

  // https://www.sfu.ca/~ssurjano/optimization.html
  function ThreeHumpCamel(input: Inputs): Output {
    const [x1, x2] = input;
    const term1 = 2 * x1 ** 2;
    const term2 = -1.05 * x1 ** 4;
    const term3 = x1 ** 6 / 6;
    const term4 = x1 * x2;
    const term5 = x2 ^ 2;
    const y = term1 + term2 + term3 + term4 + term5;
    return y;
  }

  const loss = NoisyBumpySlope;

  // Callback to loss function from dashboard
  function sample(a: number, b: number): number {
    return loss([a, b]);
  }

  // Trail of parameters towards minimum
  const xs: Array<Inputs> = [];
  const ys: Array<Output> = [];

  // Dashboard
  //const epochs = 100;
  const epochs = 2000;
  const width = 74;
  const height = 12;
  const dashboard = new Dashboard(
    width,
    height,
    xs,
    ys,
    sample,
    epochs,
  );

  // Callback to dashboard from training
  function status(
    iteration: number,
    xi: Array<number>,
    yi: Output,
    momentum: number
  ): void {
    xs.push(xi as Inputs);
    ys.push(yi);
    console.log(dashboard.render(iteration, momentum));
  }

  const parameters = [
    new Parameter("x", -5, 5),
    new Parameter("y", -5, 5),
  ];

  const minimizer = new Minimize({
    parameters,
    loss: loss as (inputs: Array<number>) => number,
    epochs,
    status,
    every: 10,
    epsilon: 0.05,
    batchSize: 100,
  });

  const iterations = minimizer.run();
  console.log(parameters.map((p) => p.print()));
  assertGreater(iterations, 0);
});
