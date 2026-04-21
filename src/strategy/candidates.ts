import { Amount, Instrument, OpenPosition } from "@sauber/backtest";
import { Tick } from "📚/tick/mod.ts";
import { Candidate, createCandidate } from "📚/strategy/candidate.ts";
import { Rater, Symbol } from "📚/strategy/parameters.ts";

// Instrument combiuned with positions in instrument
type Bundled = { instrument: Instrument; positions: OpenPosition[] };

// Combine instrument and positions
function bundle(
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

type Parameters = {
  /** List of instruments to consider for trading */
  readonly instruments: Instrument[];
  /** List of currently open positions */
  readonly positions: OpenPosition[];
  /** Function to rank instruments by expected return */
  readonly ranking: Rater;
  /** Function to rank instruments by timing */
  readonly timing: Rater;
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
    createCandidate({
      instrument: item.instrument,
      positions: item.positions,
      target: target * ranking(item.instrument, tick),
      timing: timing(item.instrument, tick),
      tick,
      stoploss,
    })
  );
