import { OpenPosition } from "@sauber/backtest";
import { Table } from "@sauber/table";
import { Tick, Timeline } from "📚/tick/mod.ts";

// Round float to 2 decimals
const currency = (x: number): number => parseFloat(x.toFixed(2));

// Display positions still open
export function displayOpenPositions(
  positions: Array<OpenPosition>,
  timeline: Timeline,
  market_end: Tick,
): string {
  const open_table = new Table();
  open_table.title = "Open Positions";
  open_table.headers = [
    "Open",
    "Investor",
    "Invested",
    "Value",
    "Unrealized",
  ];
  open_table.rows = positions.map((p) => [
    // Open date
    timeline.date(p.start),
    // Investor username
    p.instrument.symbol,
    // Invested
    currency(p.invested),
    // Current value
    currency(p.value(market_end)),
    // Profit
    currency(p.value(market_end) - p.invested),
  ]);
  return open_table.toString();
}
