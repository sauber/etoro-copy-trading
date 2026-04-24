import { Transactions } from "@sauber/backtest";
import { DateFormat, Timeline } from "📚/tick/mod.ts";
import { Table } from "@sauber/table";

// Formatter for amount value, round to 2 decimal places
const currency = (x: number): number => parseFloat(x.toFixed(2));

// Display a table of transactions
export function displayTransactions(
  transactions: Transactions,
  timeline: Timeline,
): string {
  const rows: Array<
    [DateFormat, DateFormat, number, string, number, number, string]
  > = transactions.map((
    t,
  ) => [
    // Open date
    timeline.date(t.start),
    // Close date
    timeline.date(t.end),
    // Number of days open
    t.end - t.start,
    t.instrument.symbol,
    currency(t.invested),
    currency(t.profit),
    t.reason,
  ]);

  const transaction_table = new Table();
  transaction_table.title = "Closed Positions";
  transaction_table.headers = [
    "Open",
    "Close",
    "Days",
    "Investor",
    "Invested",
    "Profit",
    "Reason",
  ];
  transaction_table.rows = rows;

  return transaction_table.toString();
}
