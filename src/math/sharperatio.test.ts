import { assertNotEquals } from "@std/assert";
import { Buffer, Price } from "@sauber/backtest";
import { randn } from "@sauber/statistics";
import { sharpe_ratio } from "📚/math/sharperatio.ts";

function makeBuffer(count: number): Buffer {
  const chart = Array<number>(count);
  let price: Price = 1000 * Math.random();
  for (let i = 0; i < count; i++) {
    const change = (randn() - 0.5) / 5;
    price *= 1 + change;
    chart[i] = parseFloat(price.toFixed(4));
  }
  return new Float32Array(chart);
}

Deno.test("Sharpe Ratio", () => {
  const buffer: Buffer = makeBuffer(300);
  const sr: number = sharpe_ratio(buffer, 0.0);
  assertNotEquals(sr, 0);
});
