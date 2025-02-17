import { StrategyContext } from "@sauber/backtest";
import { DataFrame } from "@sauber/dataframe";
import { DateFormat } from "📚/time/mod.ts";
import { Assets } from "📚/assets/assets.ts";
import { Loader } from "📚/trading/loader.ts";
import { InvestorRanking } from "📚/ranking/mod.ts";
import { Classifier } from "📚/trading/classifier.ts";
import { Timing } from "📚/timing/mod.ts";
import { makeRanker, makeTimer, Rater } from "📚/trading/raters.ts";

const start: number = new Date().getTime();

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);
let loader: Loader | null = new Loader(repo);

// Models
const ranking: InvestorRanking = await loader.rankingModel();
const ranker: Rater = makeRanker(ranking);
const timing: Timing = await loader.timingModel();
const timer: Rater = makeTimer(timing);

// const strategy: Strategy = new Policy(ranking);

// Strategy Context
const situation: StrategyContext = await loader.strategyContext();

// Settings
const tradingDate: DateFormat = await loader.tradingDate();
const username: string = await loader.username();
const positionSize: number = await loader.positionSize();

// Loading finished, free cache memory
loader = null;
const snap: number = new Date().getTime();
console.log("Data loding time (ms)", snap - start);
console.log("Account:", username, "Trading Day:", tradingDate, "Cash:", situation.amount.toFixed(2));

const classifier = new Classifier(situation, ranker, timer, positionSize);
const records = classifier.records;
// console.log(records);
const df = DataFrame.fromRecords(records);
df
  .select((r) => r["Action"] != undefined)
  .sort("Timing", false)
  .sort("Rank", false)
  .sort("Value")
  .sort("Sell")
  .sort("Buy", false)
  .digits(2)
  .print("Candidates");
