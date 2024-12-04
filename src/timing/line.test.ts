import { assertEquals, assertInstanceOf } from "@std/assert";
import { Line } from "📚/timing/line.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Line(0), Line);
});

Deno.test("Left", () => {
  const l = new Line(3);
  assertEquals(l.start("x").line, "x  ");
  assertEquals(l.start("xx", 1).line, "xxx");
});

Deno.test("Right", () => {
  const l = new Line(3, ".");
  assertEquals(l.end("x").line, "..x");
  assertEquals(l.end("xx", 2).line, "xxx");
});

Deno.test("Center", () => {
  const l = new Line(4, ".");
  assertEquals(l.center("x").line, ".x..");
  assertEquals(l.center("xx", 3).line, ".xxx");
});
