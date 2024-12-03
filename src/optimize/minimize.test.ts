import { assertEquals, assertGreater, assertInstanceOf } from "@std/assert";
import { Dashboard } from "@sauber/ml-cli-dashboard";
import { Minimize } from "📚/optimize/minimize.ts";
import { Parameter } from "📚/optimize/parameter.ts";
import { NoisyBumpySlope, Inputs, Output } from "📚/optimize/testdata.ts";

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
  const fn: (input: Inputs) => Output = NoisyBumpySlope;

  // Callback to loss function from dashboard
  function sample(a: number, b: number): number {
    return fn([a, b]);
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
    fn: fn as (inputs: Array<number>) => number,
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
