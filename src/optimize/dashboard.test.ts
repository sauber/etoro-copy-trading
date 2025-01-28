import { assertInstanceOf } from "@std/assert";
import { Dashboard } from "📚/optimize/dashboard.ts";
import {
  IntegerParameter,
  Parameter,
  Parameters,
  StaticParameter,
} from "📚/optimize/parameter.ts";
import { delay } from "jsr:@std/async/delay";

Deno.test("Instance", () => {
  assertInstanceOf(new Dashboard(), Dashboard);
});

Deno.test("Render", { ignore: false }, async () => {
  const iterations = 100;
  const console_width = 82;
  const d = new Dashboard(iterations, console_width);
  const parameters: Parameters = [
    new Parameter("Low", 0, 1, 0.25),
    new Parameter("High", 0, 1, 0.95),
    new IntegerParameter("Low Int", 0, 50, 24),
    new IntegerParameter("High Int", 50, 100, 76),
    new Parameter("Negative", -10, -5, -7),
    new Parameter(
      "Random",
      -1 - Math.random(),
      1 + Math.random(),
      Math.random() - 0.5,
    ),
    new StaticParameter("Static", 0.5),
  ];
  const loss: Array<number> = [];
  const chart: string = d.render(parameters, 0, loss);
  console.log(chart);

  for (let i = 1; i <= iterations; i++) {
    await delay(10); // wait
    parameters.forEach((p) => p.set(p.suggest()));
    loss.push(Math.random());
    const update: string = d.render(parameters, i, loss);
    console.log(update);
  }
});
