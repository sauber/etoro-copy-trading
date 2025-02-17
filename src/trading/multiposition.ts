import {
  Amount,
  Bar,
  Instrument,
  Position,
  PositionID,
  Price,
} from "@sauber/backtest";

/** A bundle of positions in the same instrument */
export class MultiPosition implements Position {
  constructor(
    /** Instrument for positions */
    public readonly instrument: Instrument,
    /** List of open positions */
    private readonly list: Array<Position> = [],
  ) {}


  /** Total amount used for opening positions */
  public get amount(): Amount {
    return this.list.reduce((sum, pos) => pos.amount + sum, 0);
  }

  /** Total amount of units opened */
  public get units(): Amount {
    return this.list.reduce((sum, pos) => pos.units + sum, 0);
  }

  /** Average opening price */
  public get price(): Price {
    return this.list.reduce((sum, pos) => pos.amount * pos.price + sum, 0) /
      this.amount;
  }

  /** Bar of first position opened */
  public get start(): Bar {
    return Math.max(...this.list.map((p) => p.start));
  }

  /** Position ID */
  public get id(): PositionID {
    return this.list[0].id;
  }

  /** Original amount invested */
  public get invested(): Amount {
    return this.amount;
  }

  /** Value at bar */
  public value(bar: Bar): Amount {
    return this.units * this.instrument.price(bar);
  }

  /** Represent position data as string */
  public print(): string {
    return `${this.instrument.symbol}/${
      this.amount.toFixed(2)
    } [${this.instrument.start}-${this.start}-${this.instrument.end}]`;
  }
}
