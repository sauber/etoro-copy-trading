import { assertEquals, assertGreater, assertInstanceOf } from "@std/assert";
import {
  Amount,
  Bar,
  CloseOrder,
  CloseOrders,
  Position,
  Price,
  PurchaseOrder,
  PurchaseOrders,
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
const closeorder: CloseOrder = { position, confidence: 1 };

Deno.test("Instance", () => {
  assertInstanceOf(new RankingStrategy(ranking), RankingStrategy);
});

Deno.test("Close", () => {
  const strategy = new RankingStrategy(ranking);
  const context: StrategyContext = {
    bar: end,
    value: amount * 2,
    amount: amount,
    purchaseorders: [purchaseorder],
    closeorders: [closeorder],
  };
  const closeorders: CloseOrders = strategy.close(context);
  if (closeorders.length > 0) {
    const co: CloseOrder = closeorders[0];
    assertGreater(co.confidence, 0);
  }
});

Deno.test("Open", () => {
  const strategy = new RankingStrategy(ranking);
  const context: StrategyContext = {
    bar: end,
    value: amount * 2,
    amount: amount,
    purchaseorders: [purchaseorder],
    closeorders: [closeorder],
  };
  const purchaseorders: PurchaseOrders = strategy.open(context);
  if (purchaseorders.length > 0) {
    const po: PurchaseOrder = purchaseorders[0];
    assertGreater(po.amount, 0);
  }
});
