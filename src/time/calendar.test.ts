import { assertEquals } from "@std/assert";
import { diffDate, nextDate, range, today } from "📚/time/calendar.ts";

Deno.test("today", () => {
  assertEquals(today(), new Date().toISOString().substring(0, 10));
});

Deno.test("diffDate", () => {
  assertEquals(diffDate("2024-02-26", "2024-03-01"), 4);
});

Deno.test("nextDate", () => {
  assertEquals(nextDate("2024-02-26", 4), "2024-03-01");
});

Deno.test("prevDate", () => {
  assertEquals(nextDate("2024-03-01", -4), "2024-02-26");
});

Deno.test("range", () => {
  assertEquals(range("2024-02-26", "2024-03-01"), [
    "2024-02-26",
    "2024-02-27",
    "2024-02-28",
    "2024-02-29",
    "2024-03-01",
  ]);
});
