import { assertEquals, assertInstanceOf, assertThrows } from "@std/assert";
import type { Tick } from "📚/tick/mod.ts";
import { Diary } from "./diary.ts";

type TestData = {
  name: string;
  id: number;
};

const testdata: Record<Tick, TestData> = {
  20240111: { name: "bar", id: 2 },
  20240109: { name: "foo", id: 1 },
};
const ticks: Tick[] = Object.keys(testdata).map(Number).sort((a, b) => a - b);
const start: Tick = ticks[0];
const end: Tick = ticks[ticks.length - 1];

Deno.test("Blank Initialization", () => {
  const diary = new Diary<TestData>({});
  assertInstanceOf(diary, Diary);
});

Deno.test("Validate", () => {
  const diary = new Diary<TestData>({});
  assertThrows(() => diary.start);
});

Deno.test("Ticks", () => {
  const diary = new Diary<TestData>(testdata);
  assertEquals(diary.ticks, ticks);
  assertEquals(diary.start, start);
  assertEquals(diary.end, end);
});

Deno.test("First and last data", () => {
  const diary = new Diary<TestData>(testdata);
  assertEquals(diary.first, testdata[start]);
  assertEquals(diary.last, testdata[end]);
});

Deno.test("Data before and after tick", () => {
  const diary = new Diary<TestData>(testdata);
  assertEquals(diary.before(start), testdata[start]);
  assertEquals(diary.after(end), testdata[end]);
});

Deno.test("Confirm ticks are sorted by smallest first", () => {
  const diary = new Diary<TestData>(testdata);
  const ticks: Tick[] = diary.ticks;
  const sorted: Tick[] = Object.keys(testdata).map(Number);
  assertEquals(ticks, sorted);
});
