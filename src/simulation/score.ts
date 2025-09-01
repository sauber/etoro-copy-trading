import { Simulation } from "@sauber/backtest";
import { avg } from "@sauber/statistics";

/** Calculate score of simulation */
export function score(simulation: Simulation): number {
  const trades: number = simulation.account.trades.length;
  if (trades === 0) {
    return 0;
  }
  const profit: number = simulation.account.profit;
  const win: number = simulation.account.WinRatioTrades;
  const frag: number = simulation.account.fragility;

  // Normalize costs: 0=no cost, 1=worst cost
  // The more trades the worse
  const trades_cost: number = Math.tanh(
    trades / simulation.account.bars,
  );
  // The more losses the worse
  const lose_cost = 1 - win;

  // Favor normal closes
  const abrupt = 1 - simulation.account.closeRatio;

  // Scale average of penalties to profit
  const cost = Math.abs(profit) * avg([trades_cost, lose_cost, frag, abrupt]);
;
  // Subtract cost from profit;
  const result = profit - cost;
  if (!isFinite(result)) {
    console.log({
      trades,
      profit,
      win,
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
