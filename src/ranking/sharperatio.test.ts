import { assertNotEquals } from "@std/assert";
import { Series, Price } from "@sauber/backtest";
import { randn } from "@sauber/statistics";
import { sharpe_ratio } from "./sharperatio.ts";

function makeSeries(count: number): Series {
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
  const series: Series = makeSeries(300);
  const sr: number = sharpe_ratio(series, 0.0);
  assertNotEquals(sr, 0);
});
