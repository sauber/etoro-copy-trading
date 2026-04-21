import { assertEquals } from "@std/assert";
import { Instrument, makeInstrument } from "@sauber/backtest";
import { candidates } from "📚/strategy/candidates.ts";
import { DELAY } from "./delay.ts";

Deno.test("candidates - returns empty array when no instruments", () => {
  const result = candidates({
    instruments: [],
    positions: [],
    ranking: () => 1,
    timing: () => 0.5,
    tick: 0,
    target: 1000,
    stoploss: 0.8,
  });
  assertEquals(result.length, 0);
});

Deno.test("candidates - creates candidate for each instrument", () => {
  const instruments: Instrument[] = [makeInstrument(100), makeInstrument(100)];

  const result = candidates({
    instruments: instruments,
    positions: [],
    ranking: () => 1,
    timing: () => 0.5,
    tick: DELAY + Math.max(...instruments.map((i) => i.start)),
    target: 1000,
    stoploss: 0.8,
  });

  assertEquals(result.length, 2);
});

Deno.test("candidates - applies ranking to target amount", () => {
  const instruments: Instrument[] = [makeInstrument(100), makeInstrument(100)];

  const result = candidates({
    instruments: instruments,
    positions: [],
    ranking: () => 0.5,
    timing: () => 0.5,
    tick: DELAY + Math.max(...instruments.map((i) => i.start)),
    target: 1000,
    stoploss: 0.8,
  });

  assertEquals(result[0].target, 500);
});
