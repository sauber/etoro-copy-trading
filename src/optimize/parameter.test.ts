import {
  assertAlmostEquals,
  assertEquals,
  assertGreater,
  assertGreaterOrEqual,
  assertInstanceOf,
  assertLess,
  assertLessOrEqual,
  assertNotEquals,
} from "@std/assert";
import {
  IntegerParameter,
  Parameter,
  ParameterData,
  StaticParameter,
} from "📚/optimize/parameter.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Parameter("", 0, 1), Parameter);
});

Deno.test("Import", () => {
  const min = 5;
  const max = 10;
  const name = "MyParm";
  const value = 7;
  const data: ParameterData = { name, min, max, value };
  const p = Parameter.import(data);
  assertEquals(p.name, name);
  assertEquals(p.value, value);
});

Deno.test("Export", () => {
  const min = 5;
  const max = 10;
  const name = "MyParm";
  const p = new Parameter(name, min, max);
  const value = p.value;
  const e: ParameterData = p.export();
  assertEquals(e, { name, min, max, value });
});

Deno.test("Min / Max", () => {
  const min = 5;
  const max = 10;
  const p = new Parameter("", min, max);
  const v: number = p.value;
  assertGreater(v, min);
  assertLess(v, max);
});

Deno.test("Set", () => {
  const min = 5;
  const max = 10;
  const p = new Parameter("", min, max);
  p.set(min - 1);
  assertEquals(p.value, min);
  p.set(max + 1);
  assertEquals(p.value, max);
});

Deno.test("Gradient", () => {
  const p = new Parameter("", 5, 10);
  p.learn(0, 1);
  p.learn(0.5, 2);
  p.learn(1, 3);
  const g: number = p.gradient;
  assertEquals(g, 2);
});

Deno.test("Learning", () => {
  const p = new Parameter("", 5, 10);
  const initial = p.value;
  p.learn(0, 1);
  p.learn(0.5, 2);
  p.learn(1, 3);
  p.update();
  const updated: number = p.value;
  assertNotEquals(updated, initial);
  assertAlmostEquals(updated, initial, 0.1);
  assertAlmostEquals(p.changed, updated - initial, 0.1);
});

Deno.test("Integer Instance", () => {
  const int = new IntegerParameter("", 1, 7);
  assertInstanceOf(int, Parameter);
  assertInstanceOf(int, IntegerParameter);
});

Deno.test("Integer Parameter", () => {
  const int = new IntegerParameter("", 1, 7);
  assertEquals(int.value, Math.round(int.value));
  const s = int.suggest();
  assertGreaterOrEqual(s, int.value - 1);
  assertLessOrEqual(s, int.value + 1);
});

Deno.test("Static Parameter", () => {
  const int = new StaticParameter("", 1);
  assertEquals(int.value, Math.round(int.value));
  assertEquals(int.suggest(), int.value);
  assertEquals(int.gradient, 0);
});
