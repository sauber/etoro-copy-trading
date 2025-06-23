import {
  Account,
  Exchange,
  Instruments,
  Simulation,
  Strategy,
} from "@sauber/backtest";
import { Assets } from "📚/assets/assets.ts";
import { Loader } from "📚/trading/loader.ts";
import { barToDate } from "📚/time/mod.ts";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);
const loader = new Loader(repo);

// Strategy
const strategy: Strategy = await loader.strategy();

// Exchange
const instruments: Instruments = await loader.instrumentSamples(400);
console.log("Testing Instruments loaded:", instruments.length);
const spread = 0.001;
const exchange: Exchange = new Exchange(instruments, spread);

// Simulation
const simulation = new Simulation(exchange, strategy);
console.log("Simulation starts");
simulation.run();
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
