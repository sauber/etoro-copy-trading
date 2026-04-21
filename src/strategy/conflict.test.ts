import {
  BuyOrder,
  Instrument,
  makeInstrument,
  OpenPosition,
  SellOrder,
} from "@sauber/backtest";
import { assertEquals, assertThrows } from "@std/assert";
import { checkConflicts } from "📚/strategy/conflict.ts";

// const series: Series = new Float32Array(100).fill(0).map((_, i) => i);
const instrument: Instrument = makeInstrument(100);
const position: OpenPosition = new OpenPosition(instrument, 0, 1000, 10);

Deno.test("No orders", () => {
  const open: BuyOrder[] = [];
  const close: SellOrder[] = [];
  assertEquals(checkConflicts(open, close), true); // Should return true
});

Deno.test("Only buy orders", () => {
  const open: BuyOrder[] = [
    { instrument, amount: 1000 },
  ];
  const close: SellOrder[] = [];
  assertEquals(checkConflicts(open, close), true); // Should return true
});

Deno.test("Only sell orders", () => {
  const positions: OpenPosition[] = [position];
  const open: BuyOrder[] = [];
  const close: SellOrder[] = [
    { position: positions[0], reason: "Take" },
  ];
  assertEquals(checkConflicts(open, close), true); // Should return true
});

Deno.test("Conflicting orders", () => {
  const open: BuyOrder[] = [
    { instrument, amount: 1000 },
  ];
  const close: SellOrder[] = [
    { position, reason: "Take" },
  ];
  assertThrows(() => checkConflicts(open, close));
});

Deno.test("No conflicts with different instruments", () => {
  const instrument2: Instrument = makeInstrument(200);
  const position2: OpenPosition = new OpenPosition(instrument2, 0, 1000, 20);
  const open: BuyOrder[] = [
    { instrument, amount: 1000 },
  ];
  const close: SellOrder[] = [
    { position: position2, reason: "Take" },
  ];
  assertEquals(checkConflicts(open, close), true); // Should return true
});
