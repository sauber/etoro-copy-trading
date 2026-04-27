import {
  Amount,
  Backtest,
  Instrument,
  Market,
  Strategy,
} from "@sauber/backtest";
import { Backend } from "@sauber/journal";

import { loadStrategy } from "📚/strategy/mod.ts";
import { Names, TestCommunity } from "📚/community/mod.ts";
import { makeRepository } from "📚/repository/mod.ts";

import { simulationPlot } from "./chart.ts";
import { displayTransactions } from "./transactions.ts";
import { displayOpenPositions } from "./positions.ts";
import { evaluation } from "./evaluation.ts";

// Repo
const path: string = Deno.args[0];
const repo: Backend = makeRepository(path);

// Strategy
const ticks_required: number = 90;
const strategy: Strategy = await loadStrategy(repo, ticks_required);

// Exchange of test investors
const community = new TestCommunity(repo);
const names: Names = await community.samples(1000);
const instruments: Instrument[] = await community.load(names);
console.log(`${instruments.length} instruments loaded for simulation`);

const spread: number = 0.001;
const market: Market = new Market(instruments);
const initial_cash: Amount = 1000;

// Run Simulation
const simulation = new Backtest(market, strategy, initial_cash, spread, spread);
console.log("Simulation starts");
simulation.run();

// Translate ticks to dates
const timeline = await community.timeline();

// Display transactions
console.log(displayTransactions(simulation.transactions, timeline));

// Plot cash and total value
console.log("[ Simulation performance ]");
console.log(simulationPlot(simulation.cash, simulation.value));
console.log(
  "Start:",
  timeline.date(market.start),
  "End:",
  timeline.date(market.end),
);

// Display positions still open
console.log(
  displayOpenPositions(simulation.portfolio.positions, timeline, market.end),
);

// Evaluation
console.log(evaluation(simulation));
