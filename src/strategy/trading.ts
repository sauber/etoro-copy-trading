import {
  Amount,
  BuyOrder,
  Instrument,
  OpenPosition,
  Order,
  Portfolio,
  SellOrder,
  Strategy,
  Tick,
} from "@sauber/backtest";
import { Weekday } from "📚/tick/mod.ts";

import { candidates } from "./candidates.ts";
import { Action, Candidate } from "./candidate.ts";
import { DELAY } from "./delay.ts";
import { Input, Rater, validation } from "./parameters.ts";
import { checkConflicts } from "./conflict.ts";
import { multiposition } from "./multiposition.ts";

// Confirm tick is certain weekday
// tick: Current tick in simulation
// start: On which weekday is tick=0
// weekday: The weekday for tick to match
const isWeekday = (tick: Tick, start: Tick, weekday: number): boolean =>
  (start + tick) % 7 === weekday;

// Confirm if instrument has number of ticks in the future
const hasFuture = (
  instrument: Instrument,
  tick: Tick,
  futureDays: number,
): boolean => instrument.end >= tick + futureDays;

/** Trading strategy */
export const trading = (
  // Loaded limit, position_size, weekday, stoploss
  settings: Input,
  // Desirability of instrument
  ranker: Rater,
  // Close or Open signal of instrument
  timer: Rater,
  // Which day of week is first date of simulation, ie. tick=0
  startWeekDay: Weekday,
  // Number of days in chart required after current tick
  futureDays: number,
): Strategy => {
  validation(settings);

  const strategy: Strategy = (
    tick: Tick,
    cash: Amount,
    instruments: Instrument[],
    portfolio: Portfolio,
  ): Order[] => {
    const isTradingDay = isWeekday(tick, startWeekDay, settings.weekday);
    // Combined positions of same instrument
    const positions = multiposition(portfolio.positions, tick);

    // List of available instruments as Set
    const instrumentSet = new Set<Instrument>(
      instruments.filter((instrument) => instrument.start <= (tick - DELAY)),
    );

    // Container for positions to close
    const close: SellOrder[] = [];

    // Confirm if any positions should be closed due to stoploss
    const remainingPositions: OpenPosition[] = [];

    for (const multiPosition of positions) {
      const value: Amount = multiPosition.value;
      if (value < multiPosition.invested * settings.stoploss) {
        // Close all individual positions, if combined positions as a whole below stoploss
        for (const position of multiPosition.positions) {
          close.push({ position, reason: "Loss" });
        }
        // Instrument no longer available for opening
        instrumentSet.delete(multiPosition.positions[0].instrument);
      } else {
        // Positions not automatically closed by stoploss, so still available
        remainingPositions.push(...multiPosition.positions);
      }
    }

    // No more decisions to open or close if not trading day, but still close positions that hit stoploss
    if (!isTradingDay) return close;

    const totalValue = cash + portfolio.value(tick);
    const target = totalValue * settings.position_size;
    const candidatesList: Candidate[] = candidates({
      instruments: Array.from(instrumentSet),
      positions: remainingPositions,
      ranking: ranker,
      timing: timer,
      tick,
      target,
      stoploss: settings.stoploss,
    });

    // Confirm if any positions should be closed due to trailing stoploss or timing
    let maxSell: number = settings.limit;
    // Sell the biggest candidates first, to free up cash for new positions
    for (const candidate of candidatesList.sort((a, b) => b.value - a.value)) {
      const action = candidate.action;
      if ((action === "Take" || action === "Trail")) {
        if (maxSell-- > 0) {
          close.push(
            ...candidate.positions.map((position: OpenPosition) => ({
              position,
              reason: action,
            })),
          );
          cash += candidate.value;
        }
      }
    }

    // Buy the biggest candidates first, until we reach the limit of open positions or available cash
    let maxBuy: number = settings.limit;
    const open: BuyOrder[] = [];
    for (const candidate of candidatesList.sort((a, b) => b.buy - a.buy)) {
      if (hasFuture(candidate.instrument, tick, futureDays)) {
        const action: Action = candidate.action;
        if (action === "Open" || action === "Increase") {
          if (candidate.buy <= cash) {
            if (maxBuy-- > 0) {
              cash -= candidate.buy;
              open.push({
                instrument: candidate.instrument,
                amount: candidate.buy,
              });
            }
          }
        }
      }
    }

    // Confirm that we are not trying to open and close the same instrument on the same tick
    checkConflicts(open, close);

    // First close, then open, to free up cash for new positions
    return [...close, ...open];
  };

  return strategy;
};
