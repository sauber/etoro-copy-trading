import { assertEquals, assertInstanceOf } from "@std/assert";
import { Exchange, TestInstrument } from "@sauber/backtest";
import { Model, TimingData } from "📚/timing/model.ts";

// Random instruments on an exchange
function makeExchange(count: number = 3): Exchange {
  return new Exchange(
    Array.from(Array(count).keys().map(() => new TestInstrument())),
  );
}

Deno.test("Generate", () => {
  assertInstanceOf(new Model(makeExchange()), Model);
});

Deno.test("Export / Import", () => {
  const exchange: Exchange = makeExchange();
  const model = new Model(exchange);
  const data: TimingData = model.export();
  assertEquals(Object.keys(data).length, 4);
  const i = Model.import(exchange, data);
  assertInstanceOf(i, Model);
});


Deno.test("Predict", () => {
  const exchange: Exchange = makeExchange();
  const model = new Model(exchange);
  const score: number = model.predict(21, 30, 70, 1);
  // console.log(score);
  assertEquals(isNaN(score), false);
});

Deno.test("Optimize", () => {
  const exchange: Exchange = makeExchange();
  const model = new Model(exchange);
  model.optimize(1);
  // console.log(model);
//   const inputs: Inputs = [input(), input(), input(), input()];
//   const outputs: Outputs = [output(), output(), output(), output()];
//   const max = 2000;
//   const results = m.train(inputs, outputs, max);
//   assertGreater(results.iterations, 0);
//   assertLessOrEqual(results.iterations, max);
});
