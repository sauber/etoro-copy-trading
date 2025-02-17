import {
  Account,
  Exchange,
  Instruments,
  Simulation,
  Strategy,
} from "@sauber/backtest";
import { Assets } from "📚/assets/assets.ts";
import { Loader } from "📚/trading/loader.ts";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);
const loader = new Loader(repo);

// Strategy
const strategy: Strategy = await loader.strategy();

// Exchange
const instruments: Instruments = await loader.instrumentSamples(400);
console.log("Instruments loaded:", instruments.length);
const spread = 0.001;
const exchange: Exchange = new Exchange(instruments, spread);

// Simulation
const simulation = new Simulation(exchange, strategy);
console.log("Simulation starts");
simulation.run();
console.log(simulation.account.toString);
console.log(simulation.account.plot());
console.log(simulation.account.portfolio.toString(exchange.end));

// Evaluation
const pct = (x: number): string => parseFloat((100 * x).toFixed(3)) + "%";
console.log("Start:", exchange.start, "End:", exchange.end);
const account: Account = simulation.account;
console.log(
  "Trades:",
  account.trades.length,
  "Profit:",
  pct(account.profit),
  "Average invested:",
  pct(account.InvestedRatio),
  "Win Ratio:",
  pct(account.WinRatio),
);
