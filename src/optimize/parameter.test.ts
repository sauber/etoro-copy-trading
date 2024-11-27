import {
assertAlmostEquals,
  assertEquals,
  assertGreater,
  assertInstanceOf,
  assertLess,
  assertNotEquals,
} from "@std/assert";
import { Parameter } from "./parameter.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Parameter(0, 1), Parameter);
});

Deno.test("Min / Max", () => {
  const min = 5;
  const max = 10;
  const p = new Parameter(min, max);
  const v: number = p.value;
  assertGreater(v, min);
  assertLess(v, max);
});

Deno.test("Gradient", () => {
  const p = new Parameter(5, 10);
  p.learn(0, 1);
  p.learn(0.5, 2);
  p.learn(1, 3);
  const g: number = p.gradient;
  assertEquals(g, 2);
});

Deno.test("Learning", () => {
  const p = new Parameter(5, 10);
  const initial = p.value;
  console.log(p.value);
  p.learn(0, 1);
  p.learn(0.5, 2);
  p.learn(1, 3);
  p.update();
  const updated: number = p.value;
  assertNotEquals(updated, initial);
  assertAlmostEquals(updated, initial, 0.01);
  // console.log(p.value);
});

// Test function
// f(x,y) = sin(x)*cos(y) + sqrt(abs(x-y))
// 4 difference minimas at aprox (-4,-4), (-1,-1), (2,2), (5,5)
