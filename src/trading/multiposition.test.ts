import { assertEquals, assertInstanceOf } from "@std/assert";
import { Amount, Bar, Position, Price } from "@sauber/backtest";
import { MultiPosition } from "📚/trading/multiposition.ts";
import { instrument } from "📚/trading/testdata.ts";

const start: Bar = instrument.start;
const end: Bar = instrument.end;
const first: Price = instrument.price(start);
const last: Price = instrument.price(end);
const amount: Amount = 100;
const units1 = first / amount;
const units2 = last / amount;
const pos1 = new Position(instrument, amount, first, units1, start, 1);
const pos2 = new Position(instrument, amount, last, units2, end, 2);

Deno.test("Instance", () => {
  assertInstanceOf(new MultiPosition(instrument), MultiPosition);
});

Deno.test("Combined amount", () => {
  const mpos = new MultiPosition(instrument, [pos1, pos2]);
  assertEquals(mpos.amount, amount * 2);
  assertEquals(mpos.invested, amount * 2);
});

Deno.test("Combined units", () => {
  const mpos = new MultiPosition(instrument, [pos1, pos2]);
  assertEquals(mpos.units, units1 + units2);
});

Deno.test("Average opening price", () => {
  const mpos = new MultiPosition(instrument, [pos1, pos2]);
  assertEquals(mpos.price, (first + last) / 2);
});

Deno.test("Bar of first opening", () => {
  const mpos = new MultiPosition(instrument, [pos2, pos1]);
  assertEquals(mpos.start, start);
});

Deno.test("ID of first opening", () => {
  const mpos = new MultiPosition(instrument, [pos1, pos2]);
  assertEquals(mpos.id, pos1.id);
});

Deno.test("Value at End", () => {
  const mpos = new MultiPosition(instrument, [pos1, pos2]);
  const value = instrument.price(end) * (units1 + units2);
  assertEquals(mpos.value(end), value);
});

Deno.test("Printable representation", () => {
  const mpos = new MultiPosition(instrument, [pos1, pos2]);
  console.log(mpos.print());
});
