import { StrategyContext } from "@sauber/backtest";
import { DataFrame } from "@sauber/dataframe";
import { type DateFormat } from "@sauber/dates";
import { Assets } from "📚/assets/assets.ts";
import { Classifier } from "📚/strategy/classifier.ts";
import { loadTimer } from "📚/timing/mod.ts";
import { Rater } from "📚/trading/raters.ts";
import { loadRanker } from "../ranking/mod.ts";
import { Context } from "./context.ts";

const start: number = performance.now();

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);
let loader: Context | null = new Context(repo.repo);

// Models
const ranker: Rater = await loadRanker(repo.repo);
const timer: Rater = await loadTimer(repo.repo);

// Strategy Context
const situation: StrategyContext = await loader.strategyContext();

// Settings
const tradingDate: DateFormat = await loader.tradingDate();
const username: string = await loader.username();
const positionSize: number = (await loader.settings()).position_size;
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
