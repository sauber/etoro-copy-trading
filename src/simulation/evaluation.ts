import { Backtest, Series } from "@sauber/backtest";
import { score } from "./score.ts";

// Average yearly return, assuming 365 days in a year
const apy = (profit: number, days: number): number =>
  (1 + profit) ** (365 / days) - 1;

// Average ratio of invested amount to total value during the simulation
const avg_invested_ratio = (invested: Series, value: Series): number =>
  invested.map((amount, index) => amount / value[index])
    .reduce((sum, x) => sum + x, 0) / invested.length;

// Display ratio float as percentage with 3 significant digits
const pct = (x: number): string => parseFloat((100 * x).toPrecision(3)) + "%";

// Summarize performance of the simulation
export function evaluation(simulation: Backtest): string {
  const trade_count = simulation.transactions.length;
  const value = simulation.value;
  const profit = value[value.length - 1] / value[0] - 1;
  const performance = apy(profit, value.length);
  const ratio = avg_invested_ratio(simulation.invested, value);
  const win_ratio = simulation.transactions.filter((t) => t.profit > 0).length /
    simulation.transactions.length;
  const reward: number = score(simulation);

  return `Trades: ${trade_count}, Profit: ${pct(profit)}, APY: ${
    pct(performance)
  }, Invested Ratio: ${pct(ratio)}, Win Ratio: ${pct(win_ratio)}, Score: ${
    pct(reward)
  }`;
}
