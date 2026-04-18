import { Amount, Instrument, OpenPosition } from "@sauber/backtest";
import { Tick } from "📚/tick/mod.ts";
import { DELAY } from "📚/strategy/mod.ts";

/** Export data examples
 * TODO: Field names and types need to be finalized
| UserName   | Open       | Days | Gain | Rank | Timing | Score | Value |  Buy | Sell | Action   |
|=======================================|=======================|=====================|==========|
| MilanIvann | 2025-01-01 |   10 |  10% |  0.7 |   -0.7 |   0.5 |  4000 | 3000 |      | Increase |
| SanjaySoni |            |      |      |  1.0 |   -1.0 |   1.0 |       | 6000 |      | Open     |
| Robier     |            |      |      | -0.6 |   -0.3 |  -0.2 |       |      |      | Ignore   |
| SCoudreau  | 2024-12-01 |   30 |  20% | -0.7 |   -0.7 |  -0.5 |  3000 |      |      | Keep     |
| AndrewJW   | 2024-11-01 |   40 |  30% |  0.4 |    0.7 |  -0.7 |  5000 |      | 5000 | Take    |
*/

// Actions to take
// Skip -- No position and no buy opportunity
// Open -- No position and buy opportunity
// Increase -- Position exists and opportunity to buy more
// Keep -- Position exists and no buy or sell opportunity
// Take -- Sell opportunity for existing positions
// Trail -- Position exists and price has dropped below stop loss level
export type Actions = "Skip" | "Open" | "Increase" | "Keep" | "Take" | "Trail";

/** Required parameters for creating a candidate */
export type CandidateParameters = {
  /** Underlying instrument */
  readonly instrument: Instrument;

  /** Current open positions in the instrument */
  readonly positions: OpenPosition[];

  /** Total target value of investments */
  readonly target: Amount;

  /** Timing factor for the candidate, -1 is best buy opportunity, 1 is best sell */
  readonly timing: number;

  /** Current tick */
  readonly tick: Tick;

  /** Trailing stop loss level in range [0.05;0.95], where 0.05 is maximum loss, and 0.95 is minimum loss */
  readonly stoploss: number;
};

/** Combination of instrument and and existing open positions in instrument */
export class Candidate {
  public readonly instrument: Instrument;
  public readonly positions: OpenPosition[] = [];
  public readonly target: Amount;
  public readonly timing: number;
  private readonly tick: Tick;
  private readonly stoploss: number;

  /** Tick of first position opened */
  public readonly start: Tick | undefined;

  /** Total amount of units opened */
  public readonly quantity: number;

  /** Total amount invested */
  public readonly invested: Amount;

  /** Total value at tick */
  public readonly value: Amount;

  /** Amount of under-investent. Negative if over-invested. */
  public readonly gap: Amount;

  /** Ratio of profit from invested */
  public readonly gain: number;

  /** How much to invest at this tick */
  public readonly buy: Amount;

  /** How many ticks since first open */
  public readonly ticksSinceOpen: number | undefined;

  /** Reason for buy or sell */
  public readonly action: Actions;

  /** Currect ratio of max drawdown since first open */
  public readonly drawdown: number | undefined;

  /** Is the candidate valid for buying */
  public readonly isBuy: boolean = false;

  /** Is the candidate valid for selling */
  public readonly isSell: boolean = false;

  /** How much to invest at this tick, or close all positions */
  constructor(p: CandidateParameters) {
    // Object.assign(this, p);
    this.instrument = p.instrument;
    this.positions = p.positions;
    this.target = p.target;
    this.timing = p.timing;
    this.tick = p.tick - DELAY; // Prices are delayed
    this.stoploss = p.stoploss;

    // First position opened at tick, and how many ticks since then
    if (this.positions.length > 0) {
      this.start = Math.min(
        ...this.positions.map((position) => position.start),
      );
      this.ticksSinceOpen = this.tick - this.start;
      // Drawdown since first open, 0: price is max, 1: price is 0
      this.drawdown = 1 - this.instrument.price(this.tick) /
          Math.max(...this.instrument.slice(this.start, this.tick).series);
    }

    // Value and profit of positions
    this.quantity = this.positions.reduce(
      (sum, position) => position.quantity + sum,
      0,
    );
    this.invested = this.positions.reduce(
      (sum, position) => sum + position.invested,
      0,
    );
    this.value = this.quantity * this.instrument.price(this.tick);
    this.gain = this.invested === 0
      ? 0
      : (this.value - this.invested) / this.invested;

    // How much to invest at this tick
    this.gap = this.target - this.value;
    this.buy = Math.max(0, this.gap * -this.timing);

    // Action to take at this tick
    if (this.positions.length == 0) {
      if (this.buy > 0) {
        this.action = "Open";
      } else if (this.drawdown && (1 - this.drawdown) < this.stoploss) {
        this.action = "Trail";
      } else {
        this.action = "Skip";
      }
    } else {
      if (this.timing > 0) {
        this.action = "Take";
      } else if (this.buy > 0) {
        this.action = "Increase";
      } else {
        this.action = "Keep";
      }
    }

    if (this.action === "Open" || this.action === "Increase") this.isBuy = true;
    if (this.action === "Take" || this.action === "Trail") this.isSell = true;
  }

  // /** Total value at bar */
  // public get value(): Amount {
  //   // End is more than two bars away
  //   if (this.tick < (this.instrument.end - 2)) {
  //     throw new Error(
  //       "Error in getting value for " + this.instrument.symbol + " bar " +
  //         this.tick + " end is " + this.instrument.end,
  //     );
  //   }

  //   // End is within two bars
  //   return this.quantity * this.instrument.price(
  //     Math.max(this.tick, this.instrument.end),
  //   );
  // }

  /** Buying score = Rank * Timing */
  // public get score(): number {
  //   return Math.max(this.rank, 0) * Math.max(-this.timing, 0);
  // }

  // public export(): CandidateExport {
  //   const candidate: BasicCandidate = {
  //     UserName: this.symbol,
  //     Rank: this.rank,
  //     Timing: this.timing,
  //   };
  //   // Open position
  //   if (this.start) {
  //     const open: HasCandidate = Object.assign({}, candidate, {
  //       Open: barToDate(this.start),
  //       Days: this.start - this.bar,
  //       Gain: this.gain,
  //       Value: this.value,
  //     });

  //     // Opportunity to sell
  //     if (this.timing > 0) {
  //       const amount: { Sell: Amount; Action: "Close" } = {
  //         Sell: this.value,
  //         Action: "Close",
  //       };
  //       const sell: CloseCandidate = Object.assign({}, open, amount);
  //       return sell;
  //     } // Opportunity to buy more
  //     else if (this.rank > 0 && this.timing < 0 && this.value < this.target) {
  //       const amount: {
  //         Score: number;
  //         Target: number;
  //         Buy: Amount;
  //         Action: "Increase";
  //       } = {
  //         Score: this.score,
  //         Target: this.target,
  //         Buy: this.BuyAmount,
  //         Action: "Increase",
  //       };
  //       const increase: IncreaseCandidate = Object.assign({}, open, amount);
  //       return increase;
  //     } // Keep position
  //     else {
  //       const action: { Action: "Keep" } = { Action: "Keep" };
  //       const keep: KeepCandidate = Object.assign({}, open, action);
  //       return keep;
  //     }
  //   } // Open new Candidate
  //   else if (this.rank > 0 && this.timing < 0) {
  //     const amount: {
  //       Score: number;
  //       Target: Amount;
  //       Buy: Amount;
  //       Action: "Open";
  //     } = {
  //       Score: this.score,
  //       Target: this.target,
  //       Buy: this.BuyAmount,
  //       Action: "Open",
  //     };
  //     const open: NewCandidate = Object.assign({}, candidate, amount);
  //     return open;
  //   }
  //   // Ignore new candidate
  //   return candidate;
  // }

  /** Candidate has positions and sell opportunity exists */
  // public get isSell(): boolean {
  //   return this.start != undefined && this.timing > 0;
  // }

  /** Candidate is underinvested and buy opportunity exists */
  // public get isBuy(): boolean {
  //   if (
  //     this.purchaseorders.length > 0 && this.rank > 0 && this.timing < 0 &&
  //     this.gap > 0
  //   ) return true;
  //   return false;
  // }
}
