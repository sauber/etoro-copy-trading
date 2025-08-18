import { assertEquals } from "@std/assert";
import { CachedSignal } from "./signal-cache.ts";
import { Bar, createTestInstrument, Instrument } from "@sauber/backtest";
import { parameters } from "./stochastic.ts";

Deno.test("CachedSignal generates and caches instrument", () => {
  const p = parameters();
  const cachedSignal = new CachedSignal(p);
  const instrument: Instrument = createTestInstrument(70);

  // First call should generate and cache
  const bar: Bar = instrument.end;
  const result1: number = cachedSignal.predict(instrument, bar);
  assertEquals(cachedSignal["charts"].size, 1);

  // Second call with the same instrument should return from cache
  const result2: number = cachedSignal.predict(instrument, bar);
  assertEquals(cachedSignal["charts"].size, 1); // Still 1, indicating cache hit
  assertEquals(result1, result2); // Should be the same instance
});
