import { Position } from "./position.ts";
import type { DateFormat } from "📚/time/mod.ts";

export type Positions = Array<Position>;

/** A collection of positions */
export class Portfolio {
  constructor(public readonly positions: Positions = []) {}

  /** Add new position to collection */
  public add(position: Position): Portfolio {
    return new Portfolio([...this.positions, position]);
  }

  /** Remove matching position */
  public remove(position: Position): Portfolio {
    return new Portfolio(this.positions.filter(p=>p.id != position.id));
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
