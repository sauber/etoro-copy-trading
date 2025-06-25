import {
  assertEquals,
  assertInstanceOf,
  assertThrows,
} from "@std/assert";
import type { DateFormat } from "@sauber/dates";
import { Diary } from "📚/investor/diary.ts";

type TestData = {
  name: string;
  id: number;
};

const testdata: Record<DateFormat, TestData> = {
  "2024-01-11": { name: "bar", id: 2 },
  "2024-01-09": { name: "foo", id: 1 },
};
const dates: DateFormat[] = Object.keys(testdata).sort();
const start: DateFormat = dates[0];
const end: DateFormat = dates[dates.length-1];

Deno.test("Blank Initialization", () => {
  const diary = new Diary<TestData>({});
  assertInstanceOf(diary, Diary);
});

Deno.test("Validate", () => {
  const diary = new Diary<TestData>({});
  assertThrows(() => diary.start);
});

Deno.test("Dates", () => {
  const diary = new Diary<TestData>(testdata);
  assertEquals(diary.dates, dates);
  assertEquals(diary.start, start);
  assertEquals(diary.end, end);
});

Deno.test("First and last data", () => {
  const diary = new Diary<TestData>(testdata);
  assertEquals(diary.first, testdata[start]);
  assertEquals(diary.last, testdata[end]);
});

Deno.test("Data before and after date", () => {
  const diary = new Diary<TestData>(testdata);
  assertEquals(diary.before(start), testdata[start]);
  assertEquals(diary.after(end), testdata[end]);
});
