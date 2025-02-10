import { assertEquals, assertInstanceOf } from "@std/assert";
import {
  Amount,
  Bar,
  CloseOrder,
  Position,
  Price,
  PurchaseOrder,
} from "@sauber/backtest";
import { context, instrument, ranking, timing } from "📚/trading/testdata.ts";
import { Candidate } from "📚/trading/candidate.ts";

const start: Bar = instrument.start;
const end: Bar = instrument.end;
const first: Price = instrument.price(start);
const last: Price = instrument.price(end);
const amount: Amount = 100;
const target: Amount = 200;
const units1 = first / amount;
const units2 = last / amount;
const pos1 = new Position(instrument, amount, first, units1, start, 1);
const pos2 = new Position(instrument, amount, last, units2, end, 2);
const rank: number = ranking(instrument);
const opportunity: number = timing(instrument);

// Generate Candidate Object
function makeCandidate(): Candidate {
  return new Candidate(instrument, start, rank, opportunity, target);
}

Deno.test("Instance", () => {
  assertInstanceOf(
    new Candidate(instrument, start, rank, opportunity, target),
    Candidate,
  );
});

Deno.test("Add CloseOrder", () => {
  const ca = makeCandidate();
  const co: CloseOrder = context.closeorders[0];
  ca.addCloseOrder(co);
});

Deno.test("Add PurchaseOrder", () => {
  const ca = makeCandidate();
  const po: PurchaseOrder = context.purchaseorders[0];
  ca.addPurchaseOrder(po);
});

Deno.test("Instrument Name", () => {
  const ca = makeCandidate();
  assertEquals(ca.symbol, instrument.symbol);
});

Deno.test("Bar when opened", () => {
  const ca = makeCandidate();
  assertEquals(ca.start, undefined);
  ca.addCloseOrder({ position: pos1, confidence: 1 });
  assertEquals(ca.start, start);
});

Deno.test("Record", () => {
  const ca = makeCandidate();
  const _r = ca.export();
  // console.log(r);
});

Deno.test("Sell or Buy", () => {
  const ca = makeCandidate();
  const sell: boolean = ca.isSell;
  assertEquals(sell, false);
  const buy: boolean = ca.isBuy;
  assertEquals(buy, false);
});
