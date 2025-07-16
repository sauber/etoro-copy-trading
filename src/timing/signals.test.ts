import { assertEquals } from "@std/assert";
import { Signals } from "./signals.ts";
import { Stochastic } from "./stochastic-signal.ts";
import { createTestInstrument, Instrument } from "@sauber/backtest";

Deno.test("Signals", async (t) => {
  await t.step("signal", async () => {
    const indicator = new Stochastic();
    const signals = new Signals(indicator);
    const instrument: Instrument = createTestInstrument();
    const result = signals.signal(instrument, 0);
    assertEquals(result, 0);
  });
});
