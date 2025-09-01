import {
  assertEquals,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLessOrEqual,
  assertThrows,
} from "@std/assert";
import { Dashboard, Output, Parameters } from "@sauber/optimize";
import {
  Bar,
  createTestInstrument,
  Exchange,
  Instrument,
} from "@sauber/backtest";

import { Rater } from "📚/strategy/mod.ts";

import { Optimize, Settings } from "./optimize.ts";

// Random instruments on an exchange
function makeExchange(count: number = 3): Exchange {
  return new Exchange(
    Array.from(Array(count).keys().map(() => createTestInstrument())),
  );
}

// Random ranker
const ranker: Rater = (_instrument: Instrument, _bar: Bar) =>
  2 * Math.random() - 1;

/** Generate an optimizer */
function makeOptimizer(investorCount: number = 3): Optimize {
  const exchange = makeExchange(investorCount);
  return new Optimize(exchange, ranker);
}

Deno.test("Optimizer instance", () => {
  const optimizer = new Optimize(makeExchange(), ranker);
  assertInstanceOf(optimizer, Optimize);
});

Deno.test("Generate starting point", () => {
  const optimizer = makeOptimizer();
  const settings: Settings = optimizer.reset(2);
  assertInstanceOf(settings, Object);
});

Deno.test("Predict from default values", () => {
  const optimizer = makeOptimizer();
  const score: number = optimizer.predict();
  assertEquals(isNaN(score), false);
});

Deno.test("Optimize", () => {
  const optimizer = makeOptimizer();
  const epochs = 5;
  const epsilon = 0.01;
  const iterations = optimizer.optimize(epochs, epsilon);
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
    parameters: Parameters,
    reward: Output[],
  ): void {
    console.log(dashboard.render(parameters, iterations, reward));
  }

  const optimizer = makeOptimizer(10);
  const epsilon = 0.01;
  const iterations = optimizer.optimize(epochs, epsilon, status);
  console.log("Iterations:", iterations);
  assertGreaterOrEqual(iterations, 1);
  assertLessOrEqual(iterations, epochs);
});

Deno.test("Get parameter values", () => {
  const optimizer = makeOptimizer();
  const allSettings: Settings = optimizer.getParameterValues();
  assertInstanceOf(allSettings, Object);

  const strategySettings: Settings = optimizer.getStrategySettings();
  assertInstanceOf(strategySettings, Object);

  const timerSettings: Settings = optimizer.getTimerSettings();
  assertInstanceOf(timerSettings, Object);
});

Deno.test("Set parameter values", () => {
  const optimizer = makeOptimizer();
  assertThrows(() => optimizer.setParameterValues({ "weekday": 420 }));
});
