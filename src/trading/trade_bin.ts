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
import { Loader } from "📚/trading/loader.ts";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);
const loader = new Loader(repo);

// Strategy
const strategy: Strategy = await loader.strategy();

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
