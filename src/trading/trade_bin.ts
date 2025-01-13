import {
  CloseOrder,
  CloseOrders,
  PurchaseOrder,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { Table } from "@sauber/table";
import { DateFormat } from "📚/time/mod.ts";
import { Assets } from "📚/assets/assets.ts";
import { type Parameters } from "📚/trading/types.ts";
import { Loader } from "📚/trading/loader.ts";
import { Ranking } from "📚/ranking/mod.ts";
import {
  CascadeStrategy,
  RankingStrategy,
  RSIStrategy,
  SizingStrategy,
  WeekdayStrategy,
} from "📚/strategy/mod.ts";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);
const loader = new Loader(repo);

// Ranking model
const model: Ranking = await loader.rankingModel();

// Strategy
const settings: Parameters = await loader.settings();
const strategy: Strategy = new CascadeStrategy([
  new WeekdayStrategy(settings.weekday),
  new RankingStrategy(model),
  new RSIStrategy(settings.window, settings.buy, settings.sell),
  new SizingStrategy(),
]);

// Strategy Context
const situation: StrategyContext = await loader.strategyContext();

// Account
const tradingDate: DateFormat = await loader.tradingDate();
console.log("Trading Day:", tradingDate);

// Trading Day
const username: string = await loader.username();
console.log("Account:", username);

// Closing
const close: CloseOrders = strategy.close(situation);
const ctable = new Table();
ctable.headers = ["UserName", "Amount"];
ctable.rows = close.map((
  c: CloseOrder,
) => [c.position.instrument.symbol, parseFloat(c.position.amount.toFixed(2))]);
console.log("Positions to close:");
console.log(ctable.toString());

// Opening
const open: PurchaseOrders = strategy.open(situation);
const otable = new Table();
otable.headers = ["UserName", "Amount"];
otable.rows = open.map((
  o: PurchaseOrder,
) => [o.instrument.symbol, parseFloat(o.amount.toFixed(2))]);
console.log("Positions to open:");
console.log(otable.toString());
