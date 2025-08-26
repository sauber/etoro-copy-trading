import { Table } from "@cliffy/table";

import { StrategyContext } from "@sauber/backtest";
import { DataFrame } from "@sauber/dataframe";
import { type DateFormat } from "@sauber/dates";
import { Classifier, Context, loadTimer, ParameterData, Rater } from "📚/strategy/mod.ts";
import { loadRanker } from "📚/ranking/mod.ts";
import { makeRepository } from "📚/repository/mod.ts";

const start: number = performance.now();

// Repo
const path: string = Deno.args[0];
const repo = makeRepository(path);
let loader: Context | null = new Context(repo);

// Models
const ranker: Rater = await loadRanker(repo);
const timer: Rater = await loadTimer(repo);

// Strategy Context
const situation: StrategyContext = await loader.strategyContext();

// Settings
const settings: ParameterData = await loader.settings();
const tradingDate: DateFormat = await loader.tradingDate();
const username: string = await loader.username();
const available: number = (await loader.tradingInstruments()).length;

// Loading finished, free cache memory
loader = null;

// Print settings
const snap: number = performance.now();
const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const table: Table = new Table(
  ["Loading", Math.round(snap - start) + " ms", "Investors", available],
  ["Account", username, "Position Size", settings.position_size],
  ["Trading Day", weekday[settings.weekday], "Trading Date", tradingDate],
  ["Stoploss", settings.stoploss, "Limit", settings.limit],
  ["Amount", situation.value.toFixed(2), "Cash", situation.amount.toFixed(2)],
);
table.render();

const classifier = new Classifier(
  situation,
  ranker,
  timer,
  settings.position_size,
);
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
