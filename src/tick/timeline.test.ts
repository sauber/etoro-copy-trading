import {
  assertEquals,
  assertInstanceOf,
  assertStrictEquals,
} from "@std/assert";
import {
  DateFormat,
  diffDate,
  nextDate,
  Timeline,
  today,
} from "📚/tick/timeline.ts";

Deno.test("diffDate", () => {
  const start = "2020-12-01";
  const end = "2020-12-02";
  const days = 1;
  assertEquals(diffDate(start, end), days);
});

Deno.test("nextDate", () => {
  const start = "2020-12-01";
  const end = "2020-12-02";
  const days = 1;
  assertEquals(nextDate(start, days), end);
});

Deno.test("today", () => {
  const today_string: DateFormat = new Date().toISOString().substring(0, 10);
  assertStrictEquals(today(), today_string);
});

Deno.test("Instance", () => {
  const ticker = new Timeline("2020-12-01");
  assertInstanceOf(ticker, Timeline);
});

Deno.test("Ticks", () => {
  const ticker = new Timeline("2020-12-01");
  assertStrictEquals(ticker.tick("2020-11-30"), -1);
  assertStrictEquals(ticker.tick("2020-12-01"), 0);
  assertStrictEquals(ticker.tick("2020-12-02"), 1);
});

Deno.test("Dates", () => {
  const ticker = new Timeline("2020-12-01");
  assertStrictEquals(ticker.date(-1), "2020-11-30");
  assertStrictEquals(ticker.date(0), "2020-12-01");
  assertStrictEquals(ticker.date(1), "2020-12-02");
});

Deno.test("Next Weekday", () => {
  const ticker = new Timeline("2020-12-01");
  // 2020-12-01 is a Tuesday (weekday=2), so next Wednesday (3) is in 1 day, and next Monday (1) is in 6 days
  assertStrictEquals(ticker.nextWeekday(0, 3), 1);
  assertStrictEquals(ticker.nextWeekday(0, 1), 6);
  assertStrictEquals(ticker.nextWeekday(6, 2), 7);

  // Tick 100 is a Thursday (2021-03-11), so next Friday (5) is in 1 day, and next Tuesday (2) is in 5 days
  assertStrictEquals(ticker.nextWeekday(100, 5), 101);
  assertStrictEquals(ticker.nextWeekday(100, 2), 105);
});
