import {
  assertEquals,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLessOrEqual,
} from "@std/assert";
import { Exchange, TestInstrument } from "@sauber/backtest";
import { Model, TimingData } from "📚/timing/model.ts";

// Random instruments on an exchange
function makeExchange(count: number = 3): Exchange {
  return new Exchange(
    Array.from(Array(count).keys().map(() => new TestInstrument())),
  );
}

Deno.test("Generate", () => {
  assertInstanceOf(new Model(), Model);
});

Deno.test("Export / Import", () => {
  const model = new Model();
  const data: TimingData = model.export();
  assertEquals(Object.keys(data).length, 4);
  const i = Model.import(data);
  assertInstanceOf(i, Model);
});

Deno.test("Predict", () => {
  const exchange: Exchange = makeExchange();
  const model = new Model();
  const score: number = model.predict(exchange);
  // console.log(score);
  assertEquals(isNaN(score), false);
});

Deno.test("Optimize", () => {
  const model = new Model();
  const exchange: Exchange = makeExchange();
  const epochs = 10;
  const epsilon = 0.01;
  const iterations = model.optimize(exchange, epochs, epsilon);
  // console.log(results);
  assertGreaterOrEqual(iterations, 1);
  assertLessOrEqual(iterations, epochs);
});

Deno.test("Visualized training", () => {
  const model = new Model();
  const exchange: Exchange = makeExchange();
  const epochs = 10;
  const epsilon = 0.01;
  const iterations = model.optimize(exchange, epochs, epsilon);
  // console.log(results);
  assertGreaterOrEqual(iterations, 1);
  assertLessOrEqual(iterations, epochs);
});
