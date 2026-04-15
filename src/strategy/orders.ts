import {
  Amount,
  ClosedPosition,
  ClosingReason,
  Instrument,
  OpenPosition,
} from "@sauber/backtest";
import { Tick } from "📚/tick/mod.ts";
import { Candidate } from "📚/strategy/candidate.ts";

// Instrument combiuned with positions in instrument
type Bundled = { instrument: Instrument; positions: OpenPosition[] };
type Symbol = string;

/** Bundle of multiple positions */
export class MultiPosition implements OpenPosition {
  public readonly start: Tick;
  public readonly instrument: Instrument;
  public readonly invested: Amount;
  public readonly quantity: number;

  constructor(public readonly positions: OpenPosition[]) {
    this.start = Math.min(...positions.map((p) => p.start));
    this.instrument = positions[0].instrument;
    this.invested = positions.reduce((sum, p) => sum + p.invested, 0);
    this.quantity = positions.reduce((sum, p) => sum + p.quantity, 0);
  }

  public value(tick: Tick): Amount {
    return this.instrument.price(tick) * this.quantity;
  }

  /** Close combined position */
  public close(
    end: Tick,
    reason: ClosingReason,
    profit: Amount,
  ): ClosedPosition {
    return {
      instrument: this.instrument,
      start: this.start,
      invested: this.invested,
      quantity: this.quantity,
      end,
      reason,
      profit,
    };
  }

  /** Close each position */
  public closeAll(
    end: Tick,
    reason: ClosingReason,
    profit: Amount,
  ): ClosedPosition[] {
    return this.positions.map((position) => ({
      instrument: position.instrument,
      start: position.start,
      invested: position.invested,
      quantity: position.quantity,
      reason,
      end,
      profit: position.quantity / this.quantity * profit,
    }));
  }
}

// Combine instrument and positions
export function bundle(
  instruments: Instrument[],
  positions: OpenPosition[],
): Array<Bundled> {
  const bundle: Record<Symbol, Bundled> = {};
  for (const instrument of instruments) {
    bundle[instrument.symbol] = { instrument, positions: [] };
  }
  for (const position of positions) {
    const symbol: Symbol = position.instrument.symbol;
    if (!bundle[symbol]) {
      bundle[symbol] = { instrument: position.instrument, positions: [] };
    }
    bundle[symbol].positions.push(position);
  }
  return Object.values(bundle);
}

// Calculate timing and rating for instrument at given tick
export type Ranker = (instrument: Instrument, tick: number) => number;

type Parameters = {
  /** List of instruments to consider for trading */
  readonly instruments: Instrument[];
  /** List of currently open positions */
  readonly positions: OpenPosition[];
  /** Function to rank instruments by expected return */
  readonly ranking: Ranker;
  /** Function to rank instruments by timing */
  readonly timing: Ranker;
  /** Target amount to invest per position */
  readonly target: Amount;
  /** Current tick */
  readonly tick: Tick;
  /** Trailing stop loss level in range [0.05;0.95], where 0.05 is maximum loss, and 0.95 is minimum loss */
  readonly stoploss: number;
};

/** Convert a list of positions and instrument to a list of candidates */
export const candidates = ({
  instruments,
  positions,
  ranking,
  timing,
  tick,
  target,
  stoploss,
}: Parameters): Candidate[] =>
  bundle(instruments, positions).map((item: Bundled) =>
    new Candidate({
      instrument: item.instrument,
      positions: item.positions,
      target: target * ranking(item.instrument, tick),
      timing: timing(item.instrument, tick),
      tick,
      stoploss,
    })
  );
