import {
  Amount,
  Bar,
  Exchange,
  Instrument,
  Instruments,
  Portfolio,
  Position,
  Positions,
  Price,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { Assets } from "../assets/assets.ts";
import { TradingStrategy } from "📚/trading/trading-strategy.ts";
import { Community, InvestorId, Mirror } from "📚/repository/mod.ts";
import { TrainingData } from "../technical/trainingdata.ts";
import { sum } from "jsr:@sauber/statistics";
import { Table } from "@sauber/table";
import { nextDate, today } from "📚/time/mod.ts";
import { Config } from "📚/config/config.ts";
import { Investor } from "📚/investor/mod.ts";

// Convert community to exchange
async function makeExchange(community: Community): Promise<Exchange> {
  const td = new TrainingData(community);
  const instruments: Instruments = await td.load();
  // const instrumentDict: Record<string, Instrument> = Object.fromEntries(
  //   instruments.map((instrument) => [instrument.symbol, instrument]),
  // );
  const exchange = new Exchange(instruments);
  return exchange;
}

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);

// Instruments
const exchange = await makeExchange(repo.community);
// Charts are two days old
const chartend: Bar = exchange.end;
const statsend: Bar = chartend - 2;
console.log("Trading Day:", nextDate(today(), -statsend));
const instruments: Instruments = exchange.on(exchange.end);

// Dummy price series for instruments now found
const unknownSeries = Array(exchange.start - chartend + 1).fill(10000);

// TODO: Load total value from config
const value: Amount = 10000;

// Positions
const config: Config = repo.config;
const username: string = (await config.get("investor") as InvestorId).UserName;
const me: Investor = await repo.community.investor(username);
console.log("My ID:", username);
const mirrors: Mirror[] = me.mirrors.last;
console.log(mirrors);
let positionid = 0;
const positions: Positions = mirrors
  .map((m: Mirror) => {
    // console.log("Mirror:", m.UserName);
    const instrument: Instrument = exchange.get(m.UserName) ||
      new Instrument(unknownSeries, chartend, m.UserName);
    // console.log("Start/end", instrument.start, instrument.end);
    const amount: Amount = m.Value / 100 * value;
    // TODO: Need date of opening to calculate opening price
    const price: Price = instrument.price(instrument.start);
    const units: number = amount / price;
    const start: Bar = 0;
    return new Position(instrument, amount, price, units, start, ++positionid);
  });

const invested: number = sum(
  positions.map((position) => position.value(chartend)),
);
// console.log({ positions, invested });

const situation: StrategyContext = {
  bar: statsend,
  value,
  amount: value - invested,
  instruments,
  positions,
};
// console.log(situation);

const strategy: Strategy = new TradingStrategy({ weekday: 1 });

const close: Positions = strategy.close(situation);
const portfolio = new Portfolio(close);
console.log("Positions to close:", portfolio.toString(chartend));

const open: PurchaseOrders = strategy.open(situation);
// console.log({ open });
const table = new Table();
table.headers = ["UserName", "Amount"];
table.rows = open.map((o) => [o.instrument.symbol, o.amount]);
console.log("Positions to open");
console.log(table.toString());
