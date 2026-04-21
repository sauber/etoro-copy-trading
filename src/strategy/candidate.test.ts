import { assertAlmostEquals, assertEquals } from "@std/assert";
import {
  Amount,
  Instrument,
  makeInstrument,
  OpenPosition,
} from "@sauber/backtest";
import { DELAY } from "./delay.ts";
import { createCandidate } from "./candidate.ts";

const amount: Amount = 500;
const instrument: Instrument = makeInstrument(100);
const positions: OpenPosition[] = [
  new OpenPosition(
    instrument,
    instrument.start,
    amount,
    amount / instrument.price(instrument.start),
  ),
];

Deno.test("Candidate - Skip action when no positions and no buy opportunity", () => {
  const candidate = createCandidate({
    instrument,
    positions: [],
    target: 1000,
    timing: 0,
    tick: 50,
    stoploss: 0.1,
  });
  assertEquals(candidate.action, "Skip");
  assertEquals(candidate.buy, 0);
});

Deno.test("Candidate - Open action when no positions and buy opportunity", () => {
  const candidate = createCandidate({
    instrument,
    positions: [],
    target: 1000,
    timing: -0.5,
    tick: 50,
    stoploss: 0.1,
  });
  assertEquals(candidate.action, "Open");
});

Deno.test("Candidate - Take profit action when position exists and timing positive", () => {
  const candidate = createCandidate({
    instrument,
    positions,
    target: 1000,
    timing: 1,
    tick: 50,
    stoploss: 0.1,
  });
  assertEquals(candidate.action, "Take");
});

Deno.test("Candidate - Increase action when position exists and buy opportunity", () => {
  const candidate = createCandidate({
    instrument,
    positions,
    target: 2000,
    timing: -0.5,
    tick: 50,
    stoploss: 0.1,
  });
  assertEquals(candidate.action, "Increase");
});

Deno.test("Candidate - Keep action when position exists and no opportunity", () => {
  const candidate = createCandidate({
    instrument,
    positions,
    target: 1000,
    timing: 0,
    tick: 50,
    stoploss: 0.1,
  });
  assertEquals(candidate.action, "Keep");
});

Deno.test("Candidate - Calculate gain", () => {
  const candidate = createCandidate({
    instrument,
    positions,
    target: 1000,
    timing: 0,
    tick: instrument.end,
    stoploss: 0.1,
  });
  assertAlmostEquals(
    candidate.gain,
    instrument.price(instrument.end - DELAY) /
        instrument.price(instrument.start) - 1,
  );
});

Deno.test("Candidate - Calculate value", () => {
  const candidate = createCandidate({
    instrument,
    positions,
    target: 1000,
    timing: 0,
    tick: instrument.end,
    stoploss: 0.1,
  });
  assertAlmostEquals(
    candidate.value,
    500 * instrument.price(instrument.end - DELAY) /
      instrument.price(instrument.start),
  );
});

Deno.test("Candidate - Calculate buying gap", () => {
  const candidate = createCandidate({
    instrument,
    positions,
    target: 1000,
    timing: -0.5,
    tick: DELAY + instrument.start,
    stoploss: 0.1,
  });
  assertAlmostEquals(candidate.buy, 250);
});

Deno.test("Candidate - Calculate no-buying gap", () => {
  const candidate = createCandidate({
    instrument,
    positions,
    target: 1000,
    timing: 0.5,
    tick: DELAY + instrument.start,
    stoploss: 0.1,
  });
  assertEquals(candidate.buy, 0);
});
