import {
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
  assertThrows,
} from "@std/assert";
import { Chart } from "./chart.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { nextDate } from "📚/time/mod.ts";

Deno.test("Blank Initialization", () => {
  const chart = new Chart([], "2022-10-10");
  assertInstanceOf(chart, Chart);
});

Deno.test("Single value", () => {
  const value = 10000;
  const end: DateFormat = "2023-10-30";
  const chart = new Chart([value], end);
  assertEquals(chart.first, value);
  assertEquals(chart.last, value);
  assertEquals(chart.start, end);
  assertEquals(chart.end, end);
  assertEquals(chart.dates, [end]);
  assertEquals(chart.value(end), value);
});

Deno.test("Series of values", () => {
  const values = [30, 31, 1, 2];
  const dates: DateFormat[] = [
    "2023-10-30",
    "2023-10-31",
    "2023-11-01",
    "2023-11-02",
  ];
  const chart = new Chart(values, dates[dates.length - 1]);
  assertEquals(chart.first, values[0]);
  assertEquals(chart.last, values[values.length - 1]);
  assertEquals(chart.start, dates[0]);
  assertEquals(chart.end, dates[dates.length - 1]);
  assertEquals(chart.dates, dates);

  for (let i = 0; i < values.length; i++) {
    assertEquals(chart.value(dates[i]), values[i]);
  }
});

Deno.test("Invalid range", () => {
  const values = [30, 31, 1, 2];
  const dates: DateFormat[] = [
    "2023-10-30",
    "2023-10-31",
    "2023-11-01",
    "2023-11-02",
  ];
  const chart = new Chart(values, dates[dates.length - 1]);

  // Before range
  assertThrows(
    () => chart.value(nextDate(dates[0], -1)),
    Error,
    "Date not in range: 2023-10-30 < 2023-10-29 < 2023-11-02",
  );

  // After range
  assertThrows(
    () => chart.value(nextDate(dates[dates.length - 1], 1)),
    Error,
    "Date not in range: 2023-10-30 < 2023-11-03 < 2023-11-02",
  );
});

Deno.test("Range from date", () => {
  const cut = "2023-11-01";
  const end = "2023-11-02";
  const chart = new Chart([10, 20, 30], end);
  const from = chart.from(cut);
  assertEquals(from.first, 20);
  assertEquals(from.last, 30);
  assertEquals(from.start, cut);
  assertEquals(from.end, end);
});

Deno.test("Range until date", () => {
  const end = "2023-10-31";
  const chart = new Chart([10, 20], end);
  const cut = nextDate(end, -1);
  const until = chart.until(cut);
  assertEquals(until.start, cut);
  assertEquals(until.end, cut);
});

Deno.test("Trimming", () => {
  const end = "2023-10-31";
  const chart = new Chart([10000, 10000, 6000, 6000], end);
  assertEquals(chart.length, 4);
  const trimmed = chart.trim;
  assertEquals(trimmed.length, 2);
  assertEquals(trimmed.values, [10000, 6000]);
});

Deno.test("Gain", () => {
  const end = "2023-10-31";
  const chart = new Chart([10, 20], end);
  const gain = chart.gain(nextDate(end, -1), end);
  assertEquals(gain, 1);
});

Deno.test("Annual Percentage Yield", () => {
  const end = "2023-10-31";
  const chart = new Chart([10, 9.9, 10.2], end);
  const apy: number = chart.annual_return;
  assertAlmostEquals(apy, 36.1134516309932);
});

Deno.test("Annual Standard Deviation", () => {
  const end = "2023-10-31";
  const chart = new Chart([10, 9.9, 10.2], end);
  const ysd: number = chart.annual_standard_deviation;
  assertAlmostEquals(ysd, 0.5444639574097383);
});

Deno.test("Sharpe Ratio", () => {
  const end = "2023-10-31";
  const chart = new Chart([10, 9.9, 10.2], end);
  const sr: number = chart.sharpe_ratio(0.0);
  assertAlmostEquals(sr, 66.32845230527529);
});
