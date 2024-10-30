import type { DateFormat } from "📚/time/mod.ts";
import { Position } from "📚/portfolio/position.ts";
import { Investor } from "📚/investor/mod.ts";

/** An exchange is a place where cash and positions are swapped for a fee */
export class Exchange {
  constructor(private readonly spread: number = 0.001) {}

  /** Generate a position from cash, subtract spread */
  public buy(
    investor: Investor,
    date: DateFormat,
    amount: number,
  ): Position {
    const fee: number = amount * this.spread;
    return new Position(investor, date, amount - fee);
  }

  /** Sell a position on a date, subtract spread, return cash */
  public sell(position: Position, date: DateFormat): number {
    const value: number = position.value(date);
    const fee: number = value * this.spread;
    return value - fee;
  }
}
