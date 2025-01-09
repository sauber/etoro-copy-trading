import {
  Account,
  Exchange,
  Instruments,
  Simulation,
  Strategy,
} from "@sauber/backtest";
import { Assets } from "📚/assets/assets.ts";
import {
  type Parameters,
  TradingStrategy,
} from "📚/trading/trading-strategy.ts";
import { Loader } from "📚/trading/loader.ts";
import { Ranking } from "📚/ranking/mod.ts";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);
const loader = new Loader(repo);

// Ranking model
const model: Ranking = await loader.rankingModel();

// Strategy
const settings: Parameters = await loader.settings();
settings.model = model;
const strategy: Strategy = new TradingStrategy(settings);

// Exchange
const instruments: Instruments = await loader.instrumentSamples(4);
console.log("Instruments loaded:", instruments.length);
const exchange: Exchange = new Exchange(instruments);
// console.log("Exchange created", exchange);

// Simulation
const simulation = new Simulation(exchange, strategy);
console.log("Simulation starts");
simulation.run();
console.log(simulation.account.toString);
console.log(simulation.account.plot());

// Evaluation
const pct = (x: number): string => parseFloat((100 * x).toFixed(3)) + "%";
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
