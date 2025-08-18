import {
  assertEquals,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLessOrEqual,
  assertThrows,
} from "@std/assert";
import { Signal } from "./signal.ts";
import { parameters } from "./stochastic.ts";
import { createTestInstrument, Instrument } from "@sauber/backtest";

Deno.test("Export", () => {
  const p = parameters();
  const signal = new Signal(p);
  const exported = signal.export();
  Object.entries(exported).forEach(([_key, value], index) => {
    assertEquals(value, p[index].value);
  });
});

Deno.test("Import", () => {
  const imp = {
    window: 14,
    smoothing: 3,
    buy: 20,
    sell: 80,
  };
  // const imp = {
  //   buy_window: 14,
  //   buy_threshold: 3,
  //   sell_window: 20,
  //   sell_threshold: 80,
  // };
  const signal: Signal = Signal.import(imp);
  assertInstanceOf(signal, Signal);
});

Deno.test("Import Missing", () => {
  const imp = {
    window: 14,
    smoothing: 3,
    buy: 20,
  };
  assertThrows(
    () => Signal.import(imp),
    Error,
    // "Missing parameter sell",
  );
});

Deno.test("Default", () => {
  const p = parameters();
  const signal: Signal = Signal.default();
  assertInstanceOf(signal, Signal);
  Object.entries(signal.export()).forEach(([_key, value], index) => {
    assertEquals(value, p[index].value);
  });
});

Deno.test("Random", () => {
  const p = parameters();
  const signal: Signal = Signal.random();
  assertInstanceOf(signal, Signal);
  Object.entries(signal.export()).forEach(([_key, value], index) => {
    assertGreaterOrEqual(value, p[index].min);
    assertLessOrEqual(value, p[index].max);
  });
});

Deno.test("Generate", () => {
  const p = parameters();
  const signal = new Signal(p);
  const instrument: Instrument = createTestInstrument(70);
  const result: Instrument = signal.generate(instrument);
  assertInstanceOf(result, Instrument);

  assertEquals(instrument.end, result.end);
  assertEquals(instrument.series.length, result.series.length);
  assertEquals(instrument.symbol, result.symbol);
  assertEquals(
    instrument.name,
    result.name.substring(0, instrument.name.length),
  );
  assertEquals(result.name.substring(instrument.name.length), ":signal");
});

Deno.test("Predict", () => {
  const signal = Signal.random();
  const instrument: Instrument = createTestInstrument(70);
  const result: number = signal.predict(instrument, instrument.end);
  assertGreaterOrEqual(result, -1);
  assertLessOrEqual(result, 1);
});
