import { assertInstanceOf } from "@std/assert";
import { Dashboard } from "📚/optimize/dashboard.ts";
import {
  IntegerParameter,
  Parameter,
  Parameters,
} from "📚/optimize/parameter.ts";
import { delay } from "jsr:@std/async/delay";

Deno.test("Instance", () => {
  assertInstanceOf(new Dashboard(), Dashboard);
});

Deno.test("Render", { ignore: true }, async () => {
  const d = new Dashboard();
  const parameters: Parameters = [
    new Parameter("Low", 0, 1, 0.25),
    new Parameter("High", 0, 1, 0.95),
    new IntegerParameter("Low Integer", 0, 50, 24),
    new IntegerParameter("High Integer", 50, 100, 76),
    new Parameter("Negative", -10, -5, -7),
    new Parameter(
      "Random",
      -1 - Math.random(),
      1 + Math.random(),
      Math.random() - 0.5,
    ),
  ];
  const chart: string = d.render(parameters);
  console.log(chart);

  for (let i = 0; i < 100; i++) {
    await delay(10); // waits for 100 milliseconds
    parameters[5].set(2 * Math.random() - 1);
    const update: string = d.render(parameters);
    console.log(update);
  }
});
