import {
  Amount,
  Bar,
  Portfolio,
  Positions,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { Table } from "@sauber/table";
import { DateFormat } from "📚/time/mod.ts";
import { Assets } from "📚/assets/assets.ts";
import { TradingStrategy } from "📚/trading/trading-strategy.ts";
import { Loader } from "📚/trading/loader.ts";
import { type Parameters } from "📚/trading/trading-strategy.ts";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);
const loader = new Loader(repo);

// Strategy
const settings: Parameters = await loader.settings();
const strategy: Strategy = new TradingStrategy(settings);

// Strategy Context
const value: Amount = await loader.value();
const amount: Amount = await loader.amount();
const bar: Bar = await loader.tradingBar();
const positions: Positions = await loader.positions();
const purchaseorders: PurchaseOrders = await loader.purchaseOrders();
const situation: StrategyContext = {
  bar,
  value,
  amount,
  purchaseorders,
  positions,
};

const tradingDate: DateFormat = await loader.tradingDate();
console.log("Trading Day:", tradingDate);

const username: string = await loader.username();
console.log("Account:", username);

const close: Positions = strategy.close(situation);
const portfolio = new Portfolio(close);
console.log("Positions to close:", portfolio.toString(bar + 2));

const open: PurchaseOrders = strategy.open(situation);
const table = new Table();
table.headers = ["UserName", "Amount"];
table.rows = open.map((o) => [o.instrument.symbol, o.amount]);
console.log("Positions to open");
console.log(table.toString());
