import {
  assertEquals,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLessOrEqual,
  assertThrows,
} from "@std/assert";
import { Dashboard, Output, Parameters } from "@sauber/optimize";
import { Instrument, makeMarket, Market } from "@sauber/backtest";

import { Rater } from "📚/strategy/mod.ts";
import { Tick, today } from "📚/tick/mod.ts";

import { Optimize, Settings } from "./optimize.ts";

// Random ranker
const ranker: Rater = (_instrument: Instrument, _tick: Tick) =>
  2 * Math.random() - 1;

/** Generate an optimizer */
function makeOptimizer(investorCount: number = 3): Optimize {
  const market: Market = makeMarket(investorCount);
  return new Optimize(market, ranker, today(), 0.01);
}

Deno.test("Optimizer instance", () => {
  const optimizer = new Optimize(makeMarket(3), ranker, today(), 0.01);
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
  const optimizer = makeOptimizer(10);
  const epsilon = 0.01;

  // Dashboard
  const epochs = 50;
  const console_width = 84;
  const dashboard: Dashboard = new Dashboard(
    optimizer.parameters,
    epochs,
    console_width,
  );
  function status(
    iterations: number,
    momentum: number,
    _parameters: Parameters,
    reward: Output[],
  ): void {
    console.log(dashboard.render(iterations, reward, momentum));
  }

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
