import {
  Amount,
  Backtest,
  Instrument,
  Market,
  Strategy,
} from "@sauber/backtest";
import { loadStrategy } from "../strategy/mod.ts";
import { Names, TestCommunity } from "../community/mod.ts";
import { makeRepository } from "../repository/mod.ts";
import { Backend } from "@sauber/journal";
import { Table } from "@sauber/table";
import { DateFormat, Timeline } from "📚/tick/mod.ts";
import { simulationPlot } from "📚/simulation/plot.ts";
import { score } from "📚/simulation/score.ts";

// Repo
const path: string = Deno.args[0];
const repo: Backend = makeRepository(path);

// Strategy
const strategy: Strategy = await loadStrategy(repo);

// Exchange of test investors
const community = new TestCommunity(repo);
const names: Names = await community.samples(1000);
const instruments: Instrument[] = await community.load(names);
console.log(`${instruments.length} instruments loaded for simulation`);

const spread: number = 0.001;
const market: Market = new Market(instruments);
// const chartStart: DateFormat = await community.chartStart();
// const timeline = new Timeline(chartStart);
const initial_cash: Amount = 1000;

// Run Simulation
const simulation = new Backtest(market, strategy, initial_cash, spread, spread);
console.log("Simulation starts");
simulation.run();

// Formatter for amount value
const currency = (x: number): number => parseFloat(x.toFixed(2));

// Display transactions
const timeline = await community.timeline();
const transactions = simulation.transactions;
const rows: Array<
  [DateFormat, DateFormat, number, string, number, number, string]
> = transactions.map((
  t,
) => [
  // Open date
  timeline.date(t.start),
  // Close date
  timeline.date(t.end),
  // Number of days open
  t.end - t.start,
  t.instrument.symbol,
  // t.Price as number,
  // t.Amount as number,
  currency(t.invested),
  currency(t.profit),
  // t.Value as number,
  t.reason,
]);
const transaction_table = new Table();
transaction_table.title = "Closed Positions";
transaction_table.headers = [
  "Open",
  "Close",
  "Days",
  // "Action",
  "Investor",
  // "Price",
  // "Amount",
  "Invested",
  "Profit",
  "Reason",
];
transaction_table.rows = rows;
console.log(transaction_table.toString());

// Plot cash and total value
console.log("[ Simulation performance ]");
console.log(simulationPlot(simulation));
console.log(
  "Start:",
  timeline.date(market.start),
  "End:",
  timeline.date(market.end),
);

// // Display positions still open
const open_table = new Table();
open_table.title = "Open Positions";
open_table.headers = [
  "Open",
  "Investor",
  "Invested",
  "Value",
  "Unrealized",
];
open_table.rows = simulation.portfolio.positions.map((p) => [
  // Open date
  timeline.date(p.start),
  // Investor username
  p.instrument.symbol,
  // Invested
  currency(p.invested),
  // Current value
  currency(p.value(market.end)),
  // Profit
  currency(p.value(market.end) - p.invested),
]);
console.log(open_table.toString());

// // Evaluation
const pct = (x: number): string => parseFloat((100 * x).toPrecision(3)) + "%";
const profit = simulation.value[simulation.value.length - 1] / initial_cash - 1;
const years: number = (market.end - market.start + 1) / 365;
const annual_return: number = (1 + profit) ** (1 / years) - 1;

const average_invested = simulation.invested.map((invested, index) => {
  const value = simulation.value[index];
  return invested === 0 ? 0 : invested / value;
}).reduce((sum, x) => sum + x, 0) / simulation.invested.length;

const win_ratio = simulation.transactions.filter((t) => t.profit > 0).length /
  simulation.transactions.length;
const reward: number = score(simulation);

console.log(
  "Trades:",
  simulation.transactions.length,
  "APY:",
  pct(annual_return),
  "Average invested:",
  pct(average_invested),
  "Win Ratio:",
  pct(win_ratio),
  "Score",
  pct(reward),
);
