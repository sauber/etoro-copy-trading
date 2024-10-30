import {
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import type { DateFormat } from "../time/mod.ts";
import { Book } from "./book.ts";
import { position, investor } from "./testdata.ts";

const chart = investor.chart;
const start: DateFormat = chart.start;
const end: DateFormat = chart.end;

Deno.test("Instance", () => {
  const book = new Book();
  assertInstanceOf(book, Book);
});

Deno.test("Deposit", () => {
  const book = new Book();
  const amount = 100000;
  book.deposit(start, amount);
  assertEquals(book.balance.cash, amount);
  assertEquals(book.balance.value, amount);
});

Deno.test("Add/Remove position", () => {
  const book = new Book();
  assertEquals(book.add(start, position), true);
  assertEquals(book.balance.invested, position.amount);
  assertEquals(book.balance.profit, 0);
  const profit: number = position.amount * (chart.last / chart.first - 1);
  const selling_amount = (position.amount * chart.last) / chart.first;
  assertEquals(book.remove(end, position, "sell", selling_amount), true);
  assertEquals(book.balance.invested, 0);
  assertAlmostEquals(book.balance.profit, profit);
});

Deno.test("Valuation", () => {
  const book = new Book();
  book.valuate(start);
  assertEquals(book.balance.value, 0);
  assertEquals(book.length, 1);
});
