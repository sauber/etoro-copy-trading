import { assertEquals } from "@std/assert";
import { Signals } from "./signals.ts";
import { Stochastic } from "./stochastic-signal.ts";
import { createTestInstrument, Instrument } from "@sauber/backtest";

Deno.test("Signals", () => {
  const indicator = new Stochastic({
    window: 14,
    smoothing: 3,
    buy: 20,
    sell: 80,
  });
  const signals = new Signals(indicator);
  const instrument: Instrument = createTestInstrument();
  const result = signals.signal(instrument, 0);
  assertEquals(result, 0);
});
