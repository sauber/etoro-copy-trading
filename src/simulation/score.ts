import { Amount, Backtest, Series, Transactions } from "@sauber/backtest";
import { avg, regression, std } from "@sauber/statistics";

/** How much values diverts on average from exponential curve */
function fragility(series: Series): number {
  const reg = regression(Array.from(series.map((v) => Math.log(v))));
  const curve: Series = series.map((_, i) =>
    Math.exp(reg.intercept + reg.gradiant * i)
  );
  const dev: number = std(Array.from(series.map((v, i) => v - curve[i])));
  const mean: number = series.slice().sort()[Math.floor(series.length / 2)];
  const fragility: number = dev / mean;
  return fragility;
}

/** Calculate score of simulation */
export function score(simulation: Backtest): number {
  const closed: Transactions = simulation.transactions;
  if (closed.length === 0) return 0;

  const wins: Transactions = closed.filter((t) => t.profit > 0);
  const expired: Transactions = closed.filter((t) => t.reason === "Expire");
  const value: Series = simulation.value;
  const first: Amount = value[0];
  const last: Amount = value[value.length - 1];

  const profitRatio: number = last / first - 1;
  const winRatio: number = wins.length / closed.length;
  const frag: number = fragility(value);

  // Normalize costs: 0=no cost, 1=worst cost
  // The more trades the worse
  const trades_cost: number = Math.tanh(closed.length / value.length);

  // The more losses the worse
  const lose_cost: number = 1 - winRatio;

  // Favor normal closes
  const abrupt: number = 1 - expired.length / closed.length;

  // Scale average of penalties to profit
  const cost: number = Math.abs(profitRatio) *
    avg([trades_cost, lose_cost, frag, abrupt]);

  // Subtract cost from profit;
  const result: number = profitRatio - cost;
  if (!isFinite(result)) {
    console.log({
      trades: closed.length,
      profitRatio,
      winRatio,
      frag,
      abrupt,
      trades_cost,
      lose_cost,
      cost,
      score: result,
    });
    throw new Error("Score is invalid");
  }

  return result;
}
