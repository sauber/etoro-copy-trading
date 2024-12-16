import { assertEquals, assertInstanceOf } from "@std/assert";
import {
  Amount,
  Bar,
  Position,
  Price,
  PurchaseOrder,
  StrategyContext,
} from "@sauber/backtest";
import { RankingStrategy } from "../strategy/ranking-strategy.ts";
import { assets } from "../assets/testdata.ts";
import { Ranking } from "📚/ranking/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { InvestorInstrument } from "📚/trading/investor-instrument.ts";

const ranking: Ranking = assets.ranking;
await ranking.load();
const investor: Investor = await assets.community.any();
const instrument = new InvestorInstrument(investor);
const amount: Amount = 1000;
const start: Bar = instrument.start;
const end: Bar = instrument.end;
const price: Price = instrument.price(start);
const position: Position = new Position(
  instrument,
  amount,
  price,
  price / amount,
  start,
  0,
);
const purchaseorder: PurchaseOrder = { instrument, amount };

Deno.test("Instance", () => {
  assertInstanceOf(new RankingStrategy(ranking), RankingStrategy);
});

Deno.test("Open/Close", () => {
  const strategy = new RankingStrategy(ranking);
  const context: StrategyContext = {
    bar: end,
    value: amount * 2,
    amount: amount,
    purchaseorders: [purchaseorder],
    positions: [position],
  };
  // console.log(strategy.close(context));
  // assertEquals(strategy.open(context), []);
  // assertEquals(strategy.close(context), []);
});
