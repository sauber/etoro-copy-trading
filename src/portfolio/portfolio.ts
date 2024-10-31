import { Position } from "📚/portfolio/position.ts";
import type { DateFormat } from "📚/time/mod.ts";

export type Positions = Array<Position>;

/** A collection of positions */
export class Portfolio {
  constructor(public readonly positions: Positions = []) {}

  /** Add new position to collection */
  public add(position: Position): Portfolio {
    // return new Portfolio([...this.positions, position]);
    this.positions.push(position);
    return this;
  }

  /** Remove matching position */
  public remove(position: Position): boolean {
    const index: number = this.positions.findIndex((p) => p.id == position.id);
    if (index < 0) return false; // Not found
    this.positions.splice(index, 1); // Remove position
    return true;
  }

  /** Count of positions */
  public get length(): number {
    return this.positions.length;
  }

  /** Sum of position amounts */
  public get invested(): number {
    return this.positions.reduce(
      (sum: number, position: Position) => sum + position.amount,
      0,
    );
  }

  /** Calculate combined profit on date */
  public profit(date: DateFormat): number {
    return this.positions.reduce(
      (sum: number, position: Position) => sum + position.profit(date),
      0,
    );
  }

  /** Current sum of values for each position */
  public value(date: DateFormat): number {
    return this.invested + this.profit(date);
  }
}
