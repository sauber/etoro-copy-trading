import {
  assertEquals,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLessOrEqual,
  assertThrows,
} from "@std/assert";
import { createTestInstrument, Instrument } from "@sauber/backtest";
import { Signal } from "./signal.ts";
import { limits } from "./indicator.ts";

const settings = Object.fromEntries(
  Object.entries(limits).map(([name, param]) => [name, param.default]),
);

Deno.test("Export", () => {
  const signal = new Signal(settings);
  const exported = signal.export();
  Object.entries(exported).forEach(([key, value]) => {
    assertEquals(value, limits[key].default);
  });
});

Deno.test("Import", () => {
  const signal: Signal = Signal.import(settings);
  assertInstanceOf(signal, Signal);
});

Deno.test("Import Missing", () => {
  const imp = {};
  assertThrows(
    () => Signal.import(imp),
    Error,
    "Missing parameter",
  );
});

Deno.test("Default", () => {
  const signal: Signal = Signal.default();
  assertInstanceOf(signal, Signal);
  Object.entries(signal.export()).forEach(([key, value]) => {
    assertEquals(value, limits[key].default);
  });
});

Deno.test("Random", () => {
  const signal: Signal = Signal.random();
  assertInstanceOf(signal, Signal);
  Object.entries(signal.export()).forEach(([key, value]) => {
    assertGreaterOrEqual(value, limits[key].min);
    assertLessOrEqual(value, limits[key].max);
  });
});

Deno.test("Generate", () => {
  const defaultValues = Object.fromEntries(
    Object.entries(limits).map((
      [name, param],
    ) => [name, param.default]),
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
