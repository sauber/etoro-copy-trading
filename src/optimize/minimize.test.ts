import {
  assertEquals,
  assertGreater,
  assertInstanceOf,
  assertLessOrEqual,
} from "@std/assert";
import { Dashboard } from "📚/optimize/dashboard.ts";
import { Minimize } from "📚/optimize/minimize.ts";
import { Parameter } from "📚/optimize/parameter.ts";
import { Inputs, NoisyBumpySlope, Output } from "📚/optimize/testdata.ts";

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

  const parameters = [
    new Parameter("x", -5, 5),
    new Parameter("y", -5, 5),
  ];

  // Dashboard
  const epochs = 20000;
  const width = 74;
  const dashboard = new Dashboard(
    width,
  );

  // Callback to dashboard from training
  function status(): void {
    console.log(dashboard.render(parameters));
  }

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
  console.log(
    "Iterations:",
    iterations,
    "Loss:",
    fn(parameters.map((p) => p.value) as Inputs),
  );
  console.log(parameters.map((p) => p.print()));
  assertGreater(iterations, 0);
  assertLessOrEqual(iterations, epochs);
});
