/** format of date */
// Example 2022-02-10
// TODO: Fix error: Type '"2022-02-04"' is not assignable to type '"${number}-${number}-${number}"'
//export type DateFormat = "${string}-${string}-${string}";
// export type DateFormat = string;
import type { DateFormat } from "./mod.ts";

/**
 * Date Cache is bi-directional linked list
 */

/** A date pointing to another date */
type DateCache = Record<DateFormat, DateFormat>;

declare global {
  var nextDateCache: DateCache;
  var prevDateCache: DateCache;
}

// Initialize global cache
globalThis.nextDateCache = {};
globalThis.prevDateCache = {};

/** Calculate or lookup next date */
function DateInc(date: DateFormat): DateFormat {
  /** Next date */
  if (!(date in nextDateCache)) {
    nextDateCache[date] = formatDate(new Date(date).getTime() + 86400000);
  }
  const next: DateFormat = nextDateCache[date];

  /** Store reverse pair */
  if (!(next in prevDateCache)) prevDateCache[next] = date;

  return next;
}

/** Calculate or lookup previous date */
function DateDec(date: DateFormat): DateFormat {
  /** Next date */
  if (!(date in prevDateCache)) {
    prevDateCache[date] = formatDate(new Date(date).getTime() - 86400000);
  }
  const prev: DateFormat = prevDateCache[date];

  /** Store reverse pair */
  if (!(prev in nextDateCache)) nextDateCache[prev] = date;

  return prev;
}

/** Date number of days away */
export function nextDate(date: DateFormat, days = 1): DateFormat {
  if (days == 1) return DateInc(date);
  else if (days > 1) return nextDate(DateInc(date), days - 1);
  else if (days == -1) return DateDec(date);
  else if (days < -1) return nextDate(DateDec(date), days + 1);
  else return date;
}

/** Number of days from start to end date */
export function diffDate(start: DateFormat, end: DateFormat): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 86400000;
}

/** DateFormat object as string */
export function formatDate(ms: number): DateFormat {
  const date = new Date(ms);
  const yyyymmdd = date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2) as DateFormat;
  return yyyymmdd;
}

/** Convert date to milliseconds */
export function msDate(date: DateFormat): number {
  return new Date(date).getTime();
}

// Todays date
export function today(): DateFormat {
  return formatDate(new Date().getTime());
}

/** A range of dates including start and end dates */
export function range(start: DateFormat, end: DateFormat): Array<DateFormat> {
  const dates = [];
  while (true) {
    dates.push(start);
    if (start == end) break;
    start = DateInc(start);
  }
  return dates;
}

/** Convert date to name of weekday */
export function weekdayFromDate(dateString: DateFormat): string {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const date = new Date(dateString);
  const dayIndex = date.getDay();
  return daysOfWeek[dayIndex];
}

/** Find most recent prior date on weekday */
export function dateFromWeekday(dateString: DateFormat, weekday: number): DateFormat {
  const date = new Date(dateString);
  const dayIndex = date.getDay();
  const offset = (7+dayIndex-weekday) % 7;
  const wanted: DateFormat = nextDate(dateString, -offset);
  return wanted;
}