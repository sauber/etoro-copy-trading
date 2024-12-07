import {
  Amount,
  Bar,
  Exchange,
  Instrument,
  Instruments,
  Position,
  Positions,
  Price,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { Assets } from "📚/backend/assets.ts";
import { NullStrategy } from "📚/timing/testdata.ts";
import { Mirror } from "📚/repository/mod.ts";
import { TrainingData } from "📚/timing/trainingdata.ts";
import { sum } from "jsr:@sauber/statistics";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);

// Instruments
const td = new TrainingData(repo.community);
const instruments: Instruments = await td.load();
const instrumentDict: Record<string, Instrument> = Object.fromEntries(
  instruments.map((instrument) => [instrument.symbol, instrument]),
);
const exchange = new Exchange(instruments);
const bar: Bar = exchange.end;

// TODO: Load total value from config
const value: Amount = 10000;

// Positions
const me = await repo.community.investor("GainersQtr");
let positionid = 0;
const positions: Positions = me.mirrors.last
  .filter((m: Mirror) => m.UserName in instrumentDict)
  .map((m: Mirror) => {
    const instrument = instrumentDict[m.UserName];
    const amount: Amount = m.Value * value;
    // TODO: Need date of opening to calculate opening price
    const price: Price = instrument.price(instrument.start);
    const units: number = amount / price;
    const start: Bar = 0;
    return new Position(instrument, amount, price, units, start, ++positionid);
  });

const invested: number = sum(
  positions.map((position) => position.value(bar)),
);
// console.log({ positions, invested });

const situation: StrategyContext = {
  bar,
  value,
  amount: value - invested,
  instruments,
  positions,
};
// console.log(situation);

const strategy: Strategy = new NullStrategy();
