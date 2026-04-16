import { Input, Rater, trading } from "📚/strategy/trading.ts";
import {
  assertArrayIncludes,
  assertEquals,
  assertInstanceOf,
  assertThrows,
} from "@std/assert";
import {
  BuyOrder,
  Instrument,
  makeMarket,
  Market,
  OpenPosition,
  Order,
  Portfolio,
  SellOrder,
  Strategy,
  Tick,
} from "@sauber/backtest";
import { DateFormat, Timeline, today } from "📚/tick/mod.ts";

// Calculate a dummy ranking score based on length of username.
export const test_ranking: Rater = (instr: Instrument, _tick: Tick) => {
  const score: number = (instr.symbol.length - 11) * 0.2;
  return score;
};

// Calculate a dummy timing score based on first letter
export const test_timing: Rater = (instr: Instrument, _tick: Tick) => {
  const score: number = -(instr.symbol.toUpperCase().charCodeAt(0) - 78) / 13;
  return score;
};

const ranker: Rater = test_ranking;
const timer: Rater = test_timing;
const startDate: DateFormat = "2022-04-25";
const timeline = new Timeline(startDate);
const start = 0;
const futureDays: number = 30;

Deno.test("Instance", () => {
  const p: Input = {
    position_size: 0.01,
    stoploss: 0.85,
    limit: 1,
    weekday: 1,
  };
  const strategy: Strategy = trading(p, ranker, timer, start, 180);
  assertInstanceOf(strategy, Function);
});

Deno.test("Parameter out of range", () => {
  const p: Input = {
    position_size: 1,
    stoploss: 0.85,
    limit: 1,
    weekday: 0,
  };
  assertThrows(() => trading(p, ranker, timer, start, 180));
});

Deno.test("Empty Orders", () => {
  const p: Input = {
    position_size: 0.01,
    stoploss: 0.85,
    limit: 1,
    weekday: 1,
  };
  const strategy: Strategy = trading(p, ranker, timer, start, 180);
  const orders: Order[] = strategy(0, 1000, [], new Portfolio());
  assertEquals(orders.length, 0);
});

Deno.test("Buy Orders", () => {
  const position_size = 0.1;
  const p: Input = {
    position_size,
    stoploss: 0.85,
    limit: 3,
    weekday: 1,
  };
  const ranker: Rater = () => 1;
  const timer: Rater = () => -1;
  const strategy: Strategy = trading(p, ranker, timer, start, futureDays);
  const market: Market = makeMarket(3, 700);
  const chartStart: Tick = Math.max(...market.instruments.map((i) => i.start));
  const tradingday: Tick = timeline.nextWeekday(chartStart, p.weekday);
  const initialCash: number = 1000;
  const orders: Order[] = strategy(
    tradingday,
    initialCash,
    market.instruments,
    new Portfolio(),
  );
  assertEquals(orders.length, market.instruments.length);
  orders.filter((o) => "amount" in o).forEach((o: BuyOrder) =>
    assertEquals(o.amount, initialCash * position_size)
  );
});

Deno.test("Sell Orders", () => {
  // First date in market (tick=0), and day of week
  const startDate: DateFormat = today();
  // const startWeekday: number = new Date(startDate).getDay();

  // Weekday where trading happens
  const weekday = 1; // Monday

  // Trading parameters
  const p: Input = {
    position_size: 0.1,
    stoploss: 0.85,
    limit: 3,
    weekday,
  };

  // Selling condition
  const ranker: Rater = () => 0;
  const timer: Rater = () => 1;

  // Configure strategy
  const strategy: Strategy = trading(p, ranker, timer, start, 180);

  // Create positions
  const positions: OpenPosition[] = makeMarket(3, 700).instruments.map((
    instrument,
  ) =>
    new OpenPosition(
      instrument,
      instrument.start,
      100,
      100 / instrument.price(instrument.start),
    )
  );
  const portfolio = new Portfolio(positions);

  // Confirm instrument start and end dates
  // positions.forEach((position) =>
  //   console.log(
  //     "Instrument",
  //     position.instrument.symbol,
  //     "[",
  //     position.instrument.start,
  //     ";",
  //     position.instrument.end,
  //     "] open",
  //     position.start,
  //   )
  // );

  // Date and weekday when last positions was open
  const lastOpenTick = Math.max(
    ...portfolio.positions.map((position) => position.start),
  );
  const lastOpenDate = new Date();
  lastOpenDate.setDate(new Date(startDate).getDate() + lastOpenTick);
  const lastOpenWeekday: number = lastOpenDate.getDay();

  // Number of days until the next trading day after most recent position open
  const daysUntilTrading: number = 1 + (8 - weekday - lastOpenWeekday) % 7;
  const tradingTick = lastOpenTick + daysUntilTrading;
  const tradingDate = new Date();
  tradingDate.setDate(new Date(startDate).getDate() + tradingTick);
  // const tradingWeekday: number = tradingDate.getDay();

  // console.log({
  //   startDate,
  //   startWeekday,
  //   weekday,
  //   lastOpenTick,
  //   lastOpenDate,
  //   lastOpenWeekday,
  //   daysUntilTrading,
  //   tradingTick,
  //   tradingDate,
  //   tradingWeekday,
  // });

  const orders: Order[] = strategy(tradingTick, 1000, [], portfolio);
  assertEquals(orders.length, portfolio.positions.length);
  assertArrayIncludes(
    portfolio.positions,
    orders.filter((o) => "reason" in o).map((o: SellOrder) => o.position),
  );
});
