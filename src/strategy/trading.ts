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
// import { DateFormat } from "📚/tick/mod.ts";
import { Backend } from "@sauber/journal";
import { Config } from "📚/config/mod.ts";
import { loadRanker } from "📚/ranking/mod.ts";
// import { Community } from "📚/community/mod.ts";
import { CachedSignal, Settings, Signal } from "📚/signal/mod.ts";
import { candidates, MultiPosition } from "📚/strategy/orders.ts";
import { Candidate } from "📚/strategy/candidate.ts";

// Count of days investor data is behind trading date
export const DELAY = 2;

/** Minimum, maximum, default value and type of parameter */
export type Range = {
  min: number;
  max: number;
  default: number;
  int?: boolean;
};

/** Short name of instrument */
type Symbol = string;

/** Collection of ranges */
export type Limits = Record<string, Range>;

export type Rater = (instrument: Instrument, tick: Tick) => number;

export const strategyParameters: Limits = {
  weekday: { min: 1, max: 5, default: 1, int: true },
  position_size: { min: 0.005, max: 0.2, default: 0.07 },
  stoploss: { min: 0.85, max: 0.95, default: 0.85 },
  limit: { min: 1, max: 15, default: 3, int: true },
};
export type Input = Record<keyof typeof strategyParameters, number>;

/** Assert that parameters are within limits */
function validation(settings: Input): boolean {
  const limits = strategyParameters;
  for (const [name, limit] of Object.entries(limits)) {
    const value = settings[name];
    if (value === undefined) throw new Error(`Missing parameter ${name}`);
    if (value < limit.min || value > limit.max) {
      throw new Error(
        `Parameter ${name} out of range [${limit.min}, ${limit.max}]: ${value}`,
      );
    }
  }
  return true;
}

// Confirm tick is certain weekday
// tick: Current tick in simulation
// start: On which weekday is tick=0
// weekday: Confirm if tick is on weekday
const isWeekday = (tick: Tick, start: Tick, weekday: number): boolean =>
  (start + tick) % 7 === weekday;
// {
//   const modulus = (start + tick) % 7;
//   console.log({ start, tick, modulus, weekday });
//   return (start + tick) % 7 === weekday;
// };

// Confirm if position is below stoploss
// const isStoploss = (
//   tick: Tick,
//   position: Position,
//   stoploss: number,
// ): boolean => position.instrument.price(tick) / position.invested < stoploss;

// Confirm is value is below stoploss ratio of max since open
// const isTrailing = (
//   tick: Tick,
//   position: Position,
//   stoploss: number,
// ): boolean => {
//   const seriesSinceOpen = position.instrument.series.slice(
//     position.start,
//     tick,
//   );
//   const maxSinceOpen = Math.max(...seriesSinceOpen);
//   const currentValue = position.instrument.price(tick);
//   return currentValue / maxSinceOpen < stoploss;
// };

// Confirm if instrument has number of ticks in the future
const hasFuture = (
  instrument: Instrument,
  tick: Tick,
  futureDays: number,
): boolean => instrument.end >= tick + futureDays;

// Value of position at tick
// const positionValue = (position: Position, tick: Tick): number =>
//   position.instrument.price(tick) * position.quantity;

// Value of portfolio at tick
// const portfolioValue = (portfolio: Portfolio, tick: Tick): number =>
//   portfolio.reduce((sum, position) => sum + positionValue(position, tick), 0);

/** Trading strategy
## Open Strategy

and(
  Weekday
  Future
  Timing < 0
  Rating > 0
  PositionSizing
  Limit
  Rounding
)

## Closing strategy

or(
  Stoploss
  and(
    Weekday
    or(
      Trailing
      and(
        Timing > 0
        limit
      )
    )
  )
)
*/
export const trading = (
  // Loaded limit, position_size, weekday, stoploss
  settings: Input,
  // Desirability of instrument
  ranker: Rater,
  // Close or Open signal of instrument
  timer: Rater,
  // First date of simulation
  start: Tick,
  // Number of days in chart required after current tick
  futureDays: number,
): Strategy => {
  validation(settings);

  // First day in simulation, which weekday is it?
  const startWeekDay: number = new Date(start).getDay();
  // console.log({ startWeekDay });

  const strategy: Strategy = (
    tick: Tick,
    cash: Amount,
    instruments: Instrument[],
    portfolio: Portfolio,
  ): Order[] => {
    const isTradingDay = isWeekday(tick, startWeekDay, settings.weekday);
    // console.log({ tick, startWeekDay, weekday: settings.weekday, isTrading });
    // const positions: OpenPosition[] = [...portfolio.add];

    // Combined positions of same instrument
    const bundle: Record<Symbol, MultiPosition> = {};
    for (const position of portfolio.positions) {
      const symbol: Symbol = position.instrument.symbol;
      if (!(symbol in bundle)) bundle[symbol] = new MultiPosition([position]);
      else bundle[symbol].positions.push(position);
    }

    // List of instruments as Set
    const instrumentSet = new Set<Instrument>(instruments);

    // Positions to close
    const close: SellOrder[] = [];

    // Confirm if any positions should be closed due to stoploss
    const remainingPositions: OpenPosition[] = [];

    // for (const position of portfolio.positions) {
    Object.entries(bundle).forEach(([_symbol, multiPosition]) => {
      const value: Amount = multiPosition.value(tick);
      if (value < multiPosition.invested * settings.stoploss) {
        // Close all individual positions, if combined positions as a whole below stoploss
        for (const position of multiPosition.positions) {
          close.push({ position, reason: "Loss" });
        }
        // Instrument no longer available for opening
        instrumentSet.delete(multiPosition.instrument);
      } else {
        // Positions not automatically closed by stoploss, so still avilable
        remainingPositions.push(...multiPosition.positions);
      }
    });
    // if (close.length > 0) console.log("Stoploss closing length", close.length);

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
    // for (const position of portfolio.positions) {
    //   const amount = positionValue(position, tick);
    //   if (isTrailing(tick, position, settings.stoploss)) {
    //     close.push({ position, reason: "Trail" });
    //     cash += amount;
    //   } else if (timer(position.instrument, tick) > 0 && maxSell-- > 0) {
    //     close.push({ position, reason: "Close" });
    //     cash += amount;
    //   }
    // }

    // Sell the biggest candidates first, to free up cash for new positions
    for (const candidate of candidatesList.sort((a, b) => b.value - a.value)) {
      const action = candidate.action;
      if ((action === "Take" || action === "Trail") && maxSell-- > 0) {
        close.push(
          ...candidate.positions.map((position) => ({
            position,
            reason: action,
          })),
        );
        cash += candidate.value;
        // closedInstruments.add(candidate.instrument);
      }
    }

    // Buy the biggest candidates first, until we reach the limit of open positions or available cash
    let maxBuy: number = settings.limit;
    const open: BuyOrder[] = [];
    for (const candidate of candidatesList.sort((a, b) => b.buy - a.buy)) {
      // console.log(
      //   "Candidate",
      //   candidate.instrument.symbol,
      //   "action",
      //   candidate.action,
      // );
      if (hasFuture(candidate.instrument, tick, futureDays)) {
        const action = candidate.action;
        if (action === "Open" || action === "Increase") {
          if (candidate.buy <= cash && maxBuy-- > 0) {
            cash -= candidate.buy;
            open.push({
              instrument: candidate.instrument,
              amount: candidate.buy,
            });
          }
        }
      }
    }

    // console.log({ positions: portfolio.positions.length, close: close.length });
    // close.forEach((order) =>
    //   console.log(order.position.instrument.symbol, order.reason)
    // );

    // Instruments to buy
    // const open: BuyOrder[] = [];
    // // console.log({ isTrading });
    // if (isTradingDay && open.length < settings.limit) {
    //   const maxPositionAmount = (cash + portfolio.value(tick)) *
    //     settings.position_size;
    //   for (const instrument of instruments) {
    //     // console.log(
    //     //   instrument.symbol,
    //     //   "hasFuture",
    //     //   hasFuture(instrument, tick, futureDays),
    //     // );
    //     if (hasFuture(instrument, tick, futureDays)) {
    //       const timing: number = timer(instrument, tick);
    //       // if (timing < 0) console.log(instrument.symbol, "timing", timing);
    //       if (timing < 0) {
    //         const rating: number = ranker(instrument, tick);
    //         // console.log(instrument.symbol, "rating", rating);
    //         if (rating > 0) {
    //           const amount = maxPositionAmount * -timing * rating;
    //           // TODO: Confirm if target amount for instrument is exceeded by existing positions
    //           // TODO: Round to nearest increment
    //           // TODO: Minimum position size
    //           open.push({ instrument, amount });
    //         }
    //       }
    //     }
    //   }
    // }

    // Confirm that we are not trying to open and close the same instrument on the same tick
    const closeInstruments = new Set(close.map((o) => o.position.instrument));
    const openInstruments = new Set(open.map((o) => o.instrument));
    const conflictingInstruments = [...closeInstruments].filter((i) =>
      openInstruments.has(i)
    );

    if (conflictingInstruments.length > 0) {
      console.warn(
        "Conflicting buy and sell orders for same instruments:",
      );
      conflictingInstruments.forEach((i) => {
        const symbol = i.symbol;
        close.filter((o) => o.position.instrument.symbol === symbol).map((o) =>
          console.log(o.reason, symbol, o.position.start)
        );
        open.filter((o) => o.instrument.symbol === symbol).map((o) =>
          console.log("Buy", symbol, o.amount)
        );
      });
      throw new Error(
        "Error: Conflicting buy and sell orders for same instruments at tick " +
          tick,
      );
    }

    return [...close, ...open];
  };

  return strategy;
};

const assetName = "trading";

/** Load strategy parameter values from repository */
export async function loadSettings(repo: Backend): Promise<Input> {
  const config = new Config(repo);
  const settings = await config.get(assetName) as Input;
  if (!validation(settings)) return {};
  return settings;
}

/** Save strategy parameter values to repository */
export async function saveSettings(
  repo: Backend,
  settings: Input,
): Promise<void> {
  if (!validation(settings)) return;
  const config = new Config(repo);
  await config.set(assetName, settings);
}

/** Strategy with parameters and models loaded from repository */
export async function loadStrategy(repo: Backend): Promise<Strategy> {
  // const config = new Config(repo);
  // const settings = await config.get(assetName) as Input;
  // const ranker: Rater = await loadRanker(repo);
  // const timer: Rater = await loadTimer(repo);
  const [settings, ranker, timer] = await Promise.all([
    loadSettings(repo),
    loadRanker(repo),
    loadTimer(repo),
  ]);

  // const community = new Community(repo);
  // const start: DateFormat | null = await community.chartStart();
  // if (!start) throw new Error("No first chart date found");
  const start: Tick = 0;

  return trading(settings, ranker, timer, start, 180);
}

/** Create a prediction wrapper */
function createRater(signal: Signal): Rater {
  const timer = (instrument: Instrument, tick: Tick) => {
    const effective: Tick = tick - DELAY;
    const value = instrument.has(effective)
      ? signal.predict(instrument, effective)
      : 0;
    return value;
  };
  return timer;
}

/** Create instance of signal from specific settings */
export function createTimer(params: Settings): Rater {
  const signal: Signal = CachedSignal.import(params);
  return createRater(signal);
}

/** Create instance of signal from saved settings */
export async function loadTimer(repo: Backend): Promise<Rater> {
  const signal: Signal = await CachedSignal.load(repo);
  return createRater(signal);
}
