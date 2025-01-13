import {
  assertEquals,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLessOrEqual,
} from "@std/assert";
import { Dashboard, Parameters } from "📚/optimize/mod.ts";
import { Exchange, TestInstrument } from "@sauber/backtest";
import { Optimize, TradingData } from "📚/timing/optimize.ts";

// Random instruments on an exchange
function makeExchange(count: number = 3): Exchange {
  return new Exchange(
    Array.from(Array(count).keys().map(() => new TestInstrument())),
  );
}

Deno.test("Generate", () => {
  assertInstanceOf(new Optimize(), Optimize);
});

Deno.test("Export / Import", () => {
  const optimize = new Optimize();
  const data: TradingData = optimize.export();
  assertEquals(Object.keys(data).length, 4);
  const i = Optimize.import(data);
  assertInstanceOf(i, Optimize);
});

Deno.test("Predict", () => {
  const exchange: Exchange = makeExchange();
  const optimize = new Optimize();
  const score: number = optimize.predict(exchange);
  assertEquals(isNaN(score), false);
});

Deno.test("Optimize", () => {
  const optimize = new Optimize();
  const exchange: Exchange = makeExchange();
  const epochs = 10;
  const epsilon = 0.01;
  const iterations = optimize.optimize(exchange, epochs, epsilon);
  assertGreaterOrEqual(iterations, 1);
  assertLessOrEqual(iterations, epochs);
});

Deno.test("Visualized training", { ignore: false }, () => {
  // Dashboard
  const epochs = 5;
  const console_width = 74;
  const dashboard: Dashboard = new Dashboard(epochs, console_width);
  function status(
    _iterations: number,
    _momentum: number,
    parameters: Parameters,
  ): void {
    console.log(dashboard.render(parameters, 1));
  }

  const optimize = new Optimize();
  const exchange: Exchange = makeExchange();
  const epsilon = 0.01;
  const iterations = optimize.optimize(exchange, epochs, epsilon, status);
  console.log("Iterations:", iterations);
  assertGreaterOrEqual(iterations, 1);
  assertLessOrEqual(iterations, epochs);
});
