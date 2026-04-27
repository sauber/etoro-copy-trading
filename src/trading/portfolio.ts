import { Amount, Instrument, OpenPosition, Portfolio } from "@sauber/backtest";

import { Mirror } from "📚/repository/mod.ts";
import { Tick } from "📚/tick/mod.ts";
import { Diary, Investor } from "📚/investor/mod.ts";
import { DELAY } from "📚/strategy/mod.ts";
import { Instruments } from "📚/trading/instruments.ts";

type Mirrors = Array<Mirror>;
type Journal = Diary<Mirrors>;

function loadMirrors(
  investor: Investor,
  tick: Tick,
): Mirrors {
  const journal: Journal = investor.mirrors;
  const ticks: Array<Tick> = journal.ticks;
  const start: Tick = ticks[0];
  const recent: Tick = ticks.findLast((d) => d <= tick) || start;
  const mirrors: Mirrors = journal.before(recent);
  return mirrors;
}

/** Start tick of position.
 * If previous list of mirrors exists, and mirror is missing, then assume it was opened here.
 * Otherwise assume opened at beginning of time.
 */
function positionStart(
  username: string,
  investor: Investor,
  trading: Tick,
): Tick {
  const journal: Journal = investor.mirrors;
  const priorTicks: Array<Tick> = journal.ticks
    .filter((d) => d < trading).reverse();
  if (priorTicks) {
    // Find first tick where mirror is no longer included
    for (const tick of priorTicks) {
      const mirrors = journal.on(tick);
      const names: Array<string> = mirrors.map((m) => m.UserName);
      if (!names.includes(username)) return tick;
    }
    // No opening date found
  }
  // Position opened at start of time
  return 0;
}

/** Position for mirror */
function position(
  instrument: Instrument,
  amount: Amount,
  start: Tick,
): OpenPosition {
  const startTick: Tick = start;
  const endTick: Tick = instrument.end;
  const startPrice: number = instrument.price(startTick);
  const endPrice: number = instrument.price(endTick);
  const startAmount: Amount = startPrice / endPrice * amount;
  const quantity: number = startAmount / startPrice;
  const position: OpenPosition = new OpenPosition(
    instrument,
    startTick,
    startAmount,
    quantity,
  );
  return position;
}

export const loadPortfolio = async (
  investor: Investor,
  tick: Tick,
  value: Amount,
  investors: Instruments,
): Promise<Portfolio> => {
  const mirrors = loadMirrors(investor, tick);
  const scale = value / 100;

  const instruments: Instrument[] = await Promise.all(
    mirrors.map((m: Mirror) => investors.instrument(m.UserName)),
  );

  const positions: OpenPosition[] = instruments.map((
    m: Instrument,
    index: number,
  ) =>
    position(
      m,
      mirrors[index].Value * scale,
      positionStart(m.symbol, investor, tick),
    )
  );

  // Confirm position has data, otherwise it's probably closed
  const open: OpenPosition[] = [];
  for (const p of positions) {
    if (p.instrument.end >= (tick - DELAY)) open.push(p);
    else {console.warn(
        "Warning: Position",
        p.instrument.symbol,
        "has no data at bar",
        tick - DELAY,
        "latest is",
        p.instrument.end,
      );}
  }

  return new Portfolio(open);
};
