import { Bar, Instrument, StrategyContext } from "@sauber/backtest";
import { DataFrame } from "@sauber/dataframe";
import { DateFormat } from "📚/time/mod.ts";
import { Assets } from "📚/assets/assets.ts";
import { Loader } from "📚/trading/loader.ts";
import { Ranking } from "📚/ranking/mod.ts";
import { Classifier } from "📚/trading/classifier.ts";
import { Timing } from "📚/timing/mod.ts";
import { Investor } from "📚/investor/mod.ts";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);
let loader: Loader | null = new Loader(repo);

// Models
const ranking: Ranking = await loader.rankingModel();
const timing: Timing = await loader.timingModel();

// const strategy: Strategy = new Policy(ranking);

// Strategy Context
const situation: StrategyContext = await loader.strategyContext();

// Account
const tradingDate: DateFormat = await loader.tradingDate();
console.log("Trading Day:", tradingDate);

// Trading Day
const username: string = await loader.username();
console.log("Account:", username);

// Loading finished, free cache memory
loader = null;

// Callback to identify rank of investor
const ranker = (instrument: Instrument, bar: Bar) =>
  ("investor" in instrument)
    ? Math.tanh(ranking.predict(instrument.investor as Investor, bar))
    : 0;

// Callback to identify timing of investor
const timer = (instrument: Instrument, bar: Bar) => {
  // console.log("Timer for", instrument.symbol, {
  //   start: instrument.start,
  //   end: instrument.end,
  //   bar,
  // });
  if (instrument.active(bar + 2)) {
    return timing.predict(instrument, bar);
  } else return 0;
};

const positionSize = 0.05;
const classifier = new Classifier(situation, ranker, timer, positionSize);
const records = classifier.records;
// console.log(records);
const df = DataFrame.fromRecords(records);
df
  .sort("Timing", false)
  .sort("Rank", false)
  .sort("Value")
  .sort("Sell")
  .sort("Buy", false)
  .digits(2)
  .print("Candidates");
