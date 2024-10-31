import { assertEquals, assertInstanceOf } from "@std/assert";
import { Deposit } from "📚/simulation/transaction.ts";
import { today } from "📚/time/mod.ts";
import { Book } from "📚/simulation/book.ts";
import { Portfolio } from "📚/portfolio/mod.ts";

const date = today();

Deno.test("Deposit", () => {
  const d = new Deposit(date, 100);
  assertInstanceOf(d, Deposit);

  const book = new Book();
  const portfolio = new Portfolio();
  const success: boolean = d.execute(book, portfolio);
  assertEquals(success, true);
  assertEquals(book.length, 1);
  // assertEquals(book.cash, 100);
});

