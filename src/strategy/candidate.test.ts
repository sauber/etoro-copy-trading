import { assertEquals, assertInstanceOf } from "@std/assert";
import { Amount, Bar, Position, Price, PurchaseOrder } from "@sauber/backtest";
import { context, instrument, test_ranking, test_timing } from "📚/trading/testdata.ts";
import { Candidate } from "./candidate.ts";

const start: Bar = instrument.start;
const first: Price = instrument.price(start);
const amount: Amount = 100;
const target: Amount = 200;
const units1 = first / amount;
const pos1 = new Position(instrument, amount, first, units1, start, 1);
const rank: number = test_ranking(instrument);
const opportunity: number = test_timing(instrument);

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

Deno.test("Add Position", () => {
  const ca = makeCandidate();
  const po: Position = context.positions[0];
  ca.addPosition(po);
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
  ca.addPosition(pos1);
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
