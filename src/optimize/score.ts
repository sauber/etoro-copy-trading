import { Simulation } from "@sauber/backtest";

export interface ScoreWeights {
  trades: number;
  lose: number;
  fragility: number;
  abrupt: number;
}

export const defaultWeights: ScoreWeights = {
  trades: 1,
  lose: 1,
  fragility: 1,
  abrupt: 1,
};

const scale = 100;

/** Calculate score of simulation with customizable weights for penalties */
export function score(simulation: Simulation, weights: ScoreWeights = defaultWeights): number {
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

  const weightedCosts =
    weights.trades * trades_cost +
    weights.lose * lose_cost +
    weights.fragility * frag +
    weights.abrupt * abrupt;

  const totalWeight = weights.trades + weights.lose + weights.fragility + weights.abrupt;
  const costs = totalWeight > 0 ? scale * (weightedCosts / totalWeight) : 0;
  // Subtract cost from profit;
  const result = profit - costs;
  if (!isFinite(result)) {
    console.log({
      trades,
      profit,
      win,
      frag,
      abrupt,
      trades_cost,
      lose_cost,
      costs,
      score: result,
    });
    throw new Error("Score is invalid");
  }


  return result;
}