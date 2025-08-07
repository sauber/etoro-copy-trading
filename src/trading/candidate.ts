import {
  Amount,
  Bar,
  Instrument,
  Position,
  Positions,
  PurchaseOrder,
  PurchaseOrders,
  Symbol,
} from "@sauber/backtest";
import { barToDate, type DateFormat } from "@sauber/dates";

/** Export data examples
| UserName   | Open       | Days | Gain | Rank | Timing | Score | Value |  Buy | Sell | Action   |
|=======================================|=======================|=====================|==========|
| MilanIvann | 2025-01-01 |   10 |  10% |  0.7 |   -0.7 |   0.5 |  4000 | 3000 |      | Increase |
| SanjaySoni |            |      |      |  1.0 |   -1.0 |   1.0 |       | 6000 |      | Open     |
| Robier     |            |      |      | -0.6 |   -0.3 |  -0.2 |       |      |      | Ignore   |
| SCoudreau  | 2024-12-01 |   30 |  20% | -0.7 |   -0.7 |  -0.5 |  3000 |      |      | Keep     |
| AndrewJW   | 2024-11-01 |   40 |  30% |  0.4 |    0.7 |  -0.7 |  5000 |      | 5000 | Close    |
*/

type Rank = number;
type Timing = number;
type Score = number;

type BasicCandidate = {
  UserName: string;
  Rank: Rank;
  Timing: Timing;
};

type IgnoreCandidate = BasicCandidate;

type NewCandidate = BasicCandidate & {
  Score: Score;
  Target: Amount;
  Buy: Amount;
  Action: "Open";
};

type HasCandidate = BasicCandidate & {
  Open: DateFormat;
  Days: number;
  Gain: number;
  Value: Amount;
};

type KeepCandidate = HasCandidate & {
  Action: "Keep";
};

type IncreaseCandidate = HasCandidate & {
  Score: Score;
  Target: Amount;
  Buy: Amount;
  Action: "Increase";
};

type CloseCandidate = HasCandidate & {
  Sell: Amount;
  Action: "Close";
};

export type CandidateExport =
  | IgnoreCandidate
  | NewCandidate
  | KeepCandidate
  | IncreaseCandidate
  | CloseCandidate;

/** Combination of purchase potential and existing open positions */
export class Candidate {
  /** List of already open positions for this instrument */
  public readonly positions: Positions = [];

  /** List of purchase orders available */
  public readonly purchaseorders: PurchaseOrders = [];

  /** Create reference to instrument */
  constructor(
    public readonly instrument: Instrument,
    private readonly bar: Bar,
    private readonly rank: Rank,
    private readonly timing: Timing,
    private readonly maxTarget: Amount,
  ) {}

  /** Add a CloseOrder to list */
  public addPosition(position: Position): void {
    this.positions.push(position);
  }

  /** Add a PurchaseOrder to list */
  public addPurchaseOrder(purchaseorder: PurchaseOrder): void {
    this.purchaseorders.push(purchaseorder);
  }

  /** Name of instrument */
  public get symbol(): Symbol {
    return this.instrument.symbol;
  }

  /** Bar when first position opened */
  public get start(): Bar | undefined {
    if (this.positions.length < 1) return undefined;
    return Math.max(...this.positions.map((position) => position.start));
  }

  /** Total amount invested */
  public get invested(): Amount {
    return this.positions.reduce((sum, position) => sum + position.amount, 0);
  }

  /** Total amount of units opened */
  public get units(): Amount {
    return this.positions.reduce((sum, position) => position.units + sum, 0);
  }

  /** Total value at bar */
  public get value(): Amount {
    // End is more than two bars away
    if (this.bar < (this.instrument.end - 2)) {
      throw new Error(
        "Error in getting value for " + this.instrument.symbol + " bar " +
          this.bar + " end is " + this.instrument.end,
      );
    }

    // End is within two bars
    return this.units * this.instrument.price(
      Math.max(this.bar, this.instrument.end),
    );
  }

  private get target(): Amount {
    return this.maxTarget * this.rank;
  }

  /** Amount of under-investent. Negative if over-invested. */
  public get gap(): number {
    return this.target - this.value;
  }

  /** Ratio of profit from positions */
  public get gain(): number {
    if (this.invested === 0) return 0;
    const invested: Amount = this.invested;
    const value: Amount = this.value;
    const profit: Amount = value - invested;
    const profitRatio: number = profit / invested;
    return profitRatio;
  }

  /** Amount when sell, which is a complete sell of whole value */
  public get sell(): Amount {
    return this.value;
  }

  /** Buying score = Rank * Timing */
  public get score(): number {
    return Math.max(this.rank, 0) * Math.max(-this.timing, 0);
  }

  /** When open or increase, by which amount */
  public get BuyAmount(): Amount {
    return Math.min(this.target * -this.timing, this.target - this.value);
  }

  public export(): CandidateExport {
    const candidate: BasicCandidate = {
      UserName: this.symbol,
      Rank: this.rank,
      Timing: this.timing,
    };
    // Open position
    if (this.start) {
      const open: HasCandidate = Object.assign({}, candidate, {
        Open: barToDate(this.start),
        Days: this.start - this.bar,
        Gain: this.gain,
        Value: this.value,
      });

      // Opportunity to sell
      if (this.timing > 0) {
        const amount: { Sell: Amount; Action: "Close" } = {
          Sell: this.value,
          Action: "Close",
        };
        const sell: CloseCandidate = Object.assign({}, open, amount);
        return sell;
      } // Opportunity to buy more
      else if (this.rank > 0 && this.timing < 0 && this.value < this.target) {
        const amount: {
          Score: number;
          Target: number;
          Buy: Amount;
          Action: "Increase";
        } = {
          Score: this.score,
          Target: this.target,
          Buy: this.BuyAmount,
          Action: "Increase",
        };
        const increase: IncreaseCandidate = Object.assign({}, open, amount);
        return increase;
      } // Keep position
      else {
        const action: { Action: "Keep" } = { Action: "Keep" };
        const keep: KeepCandidate = Object.assign({}, open, action);
        return keep;
      }
    } // Open new Candidate
    else if (this.rank > 0 && this.timing < 0) {
      const amount: {
        Score: number;
        Target: Amount;
        Buy: Amount;
        Action: "Open";
      } = {
        Score: this.score,
        Target: this.target,
        Buy: this.BuyAmount,
        Action: "Open",
      };
      const open: NewCandidate = Object.assign({}, candidate, amount);
      return open;
    }
    // Ignore new candidate
    return candidate;
  }

  /** Candidate has positions and sell opportunity exists */
  public get isSell(): boolean {
    return this.start != undefined && this.timing > 0;
  }

  /** Candidate is underinvested and buy opportunity exists */
  public get isBuy(): boolean {
    if (
      this.purchaseorders.length > 0 && this.rank > 0 && this.timing < 0 &&
      this.gap > 0
    ) return true;
    return false;
  }
}
