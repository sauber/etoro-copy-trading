import {
  assertEquals,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLessOrEqual,
  assertThrows,
} from "@std/assert";
import { Signal } from "./signal.ts";
import { inputParameters } from "./stochastic.ts";
import { createTestInstrument, Instrument } from "@sauber/backtest";

Deno.test("Export", () => {
  const defaultValues = Object.fromEntries(
    Object.entries(inputParameters).map(([name, param]) => [name, param.default])
  );
  const signal = new Signal(defaultValues);
  const exported = signal.export();
  Object.entries(exported).forEach(([key, value]) => {
    assertEquals(value, inputParameters[key].default);
  });
});

Deno.test("Import", () => {
  const imp = {
    window: 14,
    smoothing: 3,
    buy: 20,
    sell: 80,
  };
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
    "Missing parameter sell",
  );
});

Deno.test("Default", () => {
  const signal: Signal = Signal.default();
  assertInstanceOf(signal, Signal);
  Object.entries(signal.export()).forEach(([key, value]) => {
    assertEquals(value, inputParameters[key].default);
  });
});

Deno.test("Random", () => {
  const signal: Signal = Signal.random();
  assertInstanceOf(signal, Signal);
  Object.entries(signal.export()).forEach(([key, value]) => {
    assertGreaterOrEqual(value, inputParameters[key].min);
    assertLessOrEqual(value, inputParameters[key].max);
  });
});

Deno.test("Generate", () => {
  const defaultValues = Object.fromEntries(
    Object.entries(inputParameters).map(([name, param]) => [name, param.default])
  );
  const signal = new Signal(defaultValues);
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