import {
  Amount,
  ClosingReason,
  Instrument,
  OpenPosition,
} from "@sauber/backtest";
import { Tick } from "📚/tick/mod.ts";
import { DELAY } from "./delay.ts";

// Actions to take
// Skip -- No position and no buy opportunity
// Open -- No position and buy opportunity
// Increase -- Position exists and opportunity to buy more
// Keep -- Position exists and no buy or sell opportunity
// Take -- Sell opportunity for existing positions
// Trail -- Position exists and price has dropped below stop loss level

type Action = ClosingReason | "Open" | "Increase" | "Keep" | "Skip";

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
export type Candidate = {
  readonly instrument: Instrument;
  readonly positions: OpenPosition[];
  readonly target: Amount;
  readonly timing: number;
  readonly tick: Tick;
  readonly stoploss: number;
  readonly start: Tick | undefined;
  readonly quantity: number;
  readonly invested: Amount;
  readonly value: Amount;
  readonly gain: number;
  readonly gap: Amount;
  readonly buy: Amount;
  readonly ticksSinceOpen: number | undefined;
  readonly action: Action;
  readonly drawdown: number | undefined;
  readonly isBuy: boolean;
  readonly isSell: boolean;
};

/** Combination of instrument and and existing open positions in instrument */
/** Function version of Candidate that returns a plain object with all computed properties */
export function createCandidate(
  p: CandidateParameters,
): Candidate {
  const instrument = p.instrument;
  const positions = p.positions;
  const target = p.target;
  const timing = p.timing;
  const tick = p.tick - DELAY; // Prices are delayed
  const stoploss = p.stoploss;

  let start: Tick | undefined = undefined;
  let ticksSinceOpen: number | undefined = undefined;
  let drawdown: number | undefined = undefined;

  if (positions.length > 0) {
    start = Math.min(...positions.map((position) => position.start));
    ticksSinceOpen = tick - start;
    drawdown = 1 - instrument.price(tick) /
        Math.max(...instrument.slice(start, tick).series);
  }

  const quantity = positions.reduce(
    (sum, position) => position.quantity + sum,
    0,
  );
  const invested = positions.reduce(
    (sum, position) => sum + position.invested,
    0,
  );
  const value = quantity * instrument.price(tick);
  const gain = invested === 0 ? 0 : (value - invested) / invested;

  const gap = target - value;
  const buy = Math.max(0, gap * -timing);

  let action: Action = "Skip";
  if (positions.length == 0) {
    if (buy > 0) {
      action = "Open";
    } else if (drawdown && (1 - drawdown) < stoploss) {
      action = "Trail";
    } else {
      action = "Skip";
    }
  } else {
    if (timing > 0) {
      action = "Take";
    } else if (buy > 0) {
      action = "Increase";
    } else {
      action = "Keep";
    }
  }

  const isBuy = action === "Open" || action === "Increase";
  const isSell = action === "Take" || action === "Trail";

  return {
    instrument,
    positions,
    target,
    timing,
    tick,
    stoploss,
    start,
    quantity,
    invested,
    value,
    gain,
    gap,
    buy,
    ticksSinceOpen,
    action,
    drawdown,
    isBuy,
    isSell,
  } as const;
}
