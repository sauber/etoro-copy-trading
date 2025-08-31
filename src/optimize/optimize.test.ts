import {
  assertEquals,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLessOrEqual,
} from "@std/assert";
import {
  Dashboard,
  Output,
  Parameters as OptimizerParameters,
} from "@sauber/optimize";
import {
  Bar,
  createTestInstrument,
  Exchange,
  Instrument,
} from "@sauber/backtest";

import { inputParameters, Rater } from "📚/strategy/mod.ts";
import { limits } from "📚/signal/mod.ts";

import { Optimize } from "./optimize.ts";
import { Parameters } from "./parameters.ts";

// Random instruments on an exchange
function makeExchange(count: number = 3): Exchange {
  return new Exchange(
    Array.from(Array(count).keys().map(() => createTestInstrument())),
  );
}

const strategy = Parameters.fromLimits(inputParameters);
const signal = Parameters.fromLimits(limits);
const allParameters = new Parameters([...strategy.all(), ...signal.all()]);

// Random ranker
const ranker: Rater = (_instrument: Instrument, _bar: Bar) =>
  2 * Math.random() - 1;

/** Generate an optimizer with best starting point */
function makeOptimizer(): Optimize {
  const exchange = makeExchange();
  const o = new Optimize(allParameters, ranker);
  const optimizer = o.generate(exchange, 3, ranker);
  return optimizer;
}

Deno.test("Generate best model from random parameters", () => {
  const optimizer = makeOptimizer();
  assertInstanceOf(optimizer, Optimize);
});

// Deno.test("Export / Import", () => {
//   const optimizer: Optimize = makeOptimizer();
//   const data = optimizer.export() as StrategyParameters;
//   const count = 8;
//   assertEquals(Object.keys(data).length, count);
//   const imported = Optimize.import(data, ranker);
//   assertInstanceOf(imported, Optimize);
// });

Deno.test("Predict", () => {
  const exchange = makeExchange();
  const o = new Optimize(allParameters, ranker);
  const optimizer = o.generate(exchange, 3, ranker);
  const score: number = optimizer.predict(exchange);
  // console.log({ score });
  assertEquals(isNaN(score), false);
});

Deno.test("Optimize", () => {
  const exchange = makeExchange();
  const o = new Optimize(allParameters, ranker);
  const optimizer = o.generate(exchange, 3, ranker);
  const epochs = 10;
  const epsilon = 0.01;
  const iterations = optimizer.optimize(exchange, epochs, epsilon);
  assertGreaterOrEqual(iterations, 1);
  assertLessOrEqual(iterations, epochs);
});

Deno.test("Visualized training", { ignore: true }, () => {
  // Dashboard
  const epochs = 50;
  const console_width = 84;
  const dashboard: Dashboard = new Dashboard(epochs, console_width);
  function status(
    iterations: number,
    _momentum: number,
    parameters: OptimizerParameters,
    reward: Output[],
  ): void {
    console.log(dashboard.render(parameters, iterations, reward));
  }

  const exchange = makeExchange(10);
  const o = new Optimize(allParameters, ranker);
  const optimizer = o.generate(exchange, 10, ranker);
  const epsilon = 0.01;
  const iterations = optimizer.optimize(exchange, epochs, epsilon, status);
  console.log("Iterations:", iterations);
  assertGreaterOrEqual(iterations, 1);
  assertLessOrEqual(iterations, epochs);
});
