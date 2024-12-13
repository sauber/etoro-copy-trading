import { Exchange, Instruments, Simulation, Stats, Strategy } from "@sauber/backtest";
import { Assets } from "📚/assets/assets.ts";
import { Community, Names } from "📚/repository/mod.ts";
import { TradingStrategy, type Parameters } from "📚/trading/trading-strategy.ts";
import { Loader } from "📚/trading/loader.ts";
import { nextDate, today } from "📚/time/mod.ts";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);
const loader = new Loader(repo);

// Strategy
const settings: Parameters = await loader.settings();
const strategy: Strategy = new TradingStrategy(settings);

// Exchange
const community: Community = repo.community;
const names: Names = await community.allNames();
const instruments: Instruments = await Promise.all(
  names.map((name) => loader.instrument(name)),
);
console.log("Instruments loaded:", instruments.length);
const exchange: Exchange = new Exchange(instruments);

// Simulation
const simulation = new Simulation(exchange, strategy);
simulation.run();
console.log(simulation.account.toString);
console.log(simulation.account.plot());

// Evaluation
const pct = (x: number): string => parseFloat((100*x).toFixed(3)) + "%";
const stats: Stats = simulation.stats;
const period: string = [
  nextDate(today(), -simulation.account.valuation.start),
  nextDate(today(), -simulation.account.valuation.end),
].join("..");
console.log(
  "Period:", period,
  "Trades:", stats.trades.length,
  "Profit:", pct(stats.profit),
  "Average invested:", pct(stats.InvestedRatio),
  "Win Ratio:", pct(stats.WinRatio),
);

