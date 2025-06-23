import {
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLessOrEqual,
} from "@std/assert";
import { Buffer, Instrument, Price } from "@sauber/backtest";
import { Timing } from "📚/timing/timing.ts";
import { randn } from "@sauber/statistics";

function makeBuffer(count: number): Buffer {
  const chart: number[] = [];
  let price: Price = 1000 * Math.random();
  for (let i = 0; i < count; i++) {
    const change = (randn() - 0.5) / 5; // +/- 2.5%
    price *= 1 + change;
    chart.push(parseFloat(price.toFixed(4)));
  }
  return new Float32Array(chart);
}

const instrument = {
  buffer: makeBuffer(100),
  end: 0,
  symbol: "TEST",
} as Instrument;

Deno.test("instance", () => {
  assertInstanceOf(new Timing(14, 40, 14), Timing);
});

Deno.test("Buy Signal", () => {
  const t = new Timing(14, 40, 4);
  const signal = t.predict(instrument, 0);
  assertGreaterOrEqual(signal, -1);
  assertLessOrEqual(signal, 1);
});
