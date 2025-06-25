import { StrategyContext } from "@sauber/backtest";
import { DataFrame } from "@sauber/dataframe";
import { type DateFormat } from "@sauber/dates";
import { Assets } from "📚/assets/assets.ts";
import { Loader } from "📚/trading/loader.ts";
import { InvestorRanking } from "📚/ranking/mod.ts";
import { Classifier } from "📚/trading/classifier.ts";
import { Timing } from "📚/timing/mod.ts";
import { makeRanker, makeTimer, Rater } from "📚/trading/raters.ts";

const start: number = performance.now();

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

// Strategy Context
const situation: StrategyContext = await loader.strategyContext();

// Settings
const tradingDate: DateFormat = await loader.tradingDate();
const username: string = await loader.username();
const positionSize: number = await loader.positionSize();
const stoploss: number = (await loader.settings()).stoploss;
const limit: number = (await loader.settings()).limit;

// Loading finished, free cache memory
loader = null;
const snap: number = performance.now();
console.log("Data loading time (ms)", snap - start);
console.log("Account:", username, "Trading Day:", tradingDate, "SL:", stoploss, "Limit:", limit, "Cash:", situation.amount.toFixed(2));

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
