import {
  Account,
  Exchange,
  Instruments,
  Simulation,
  Strategy,
} from "@sauber/backtest";
import { Assets } from "📚/assets/assets.ts";
import { barToDate } from "@sauber/dates";
import { loadStrategy } from "../strategy/mod.ts";
import { Names, TestCommunity } from "../community/mod.ts";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);

// Strategy
const strategy: Strategy = await loadStrategy(repo.repo);

// Exchange of test investors
const community = new TestCommunity(repo.repo);
const names: Names = await community.samples(40);
const instruments: Instruments = await community.load(names);
const spread = 0.001;
const exchange: Exchange = new Exchange(instruments, spread);

// Run Simulation
const simulation = new Simulation(exchange, strategy);
console.log("Simulation starts");
simulation.run();

// Display results
console.log(simulation.account.toString());
console.log(simulation.account.plot());
console.log(simulation.account.portfolio.toString(exchange.end));

// Evaluation
const pct = (x: number): string => parseFloat((100 * x).toFixed(3)) + "%";
const account: Account = simulation.account;
const profit = account.profit;
const years: number = (exchange.start - exchange.end) / 365;
const annual_return: number = (1 + profit) ** (1 / years) - 1;

console.log(
  "Start:",
  barToDate(exchange.start),
  "End:",
  barToDate(exchange.end),
);
console.log(
  "Trades:",
  account.trades.length,
  "APY:",
  pct(annual_return),
  "Average invested:",
  pct(account.InvestedRatio),
  "Win Ratio:",
  pct(account.WinRatioTrades),
);

