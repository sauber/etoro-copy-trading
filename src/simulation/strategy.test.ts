import { assertEquals, assertInstanceOf } from "@std/assert";
import { Position } from "@sauber/trading-account";
import {
  ExitStrategy,
  NullStrategy,
  type Positions,
  RandomStrategy,
  Strategy,
} from "📚/simulation/strategy.ts";
import { community, investor } from "📚/simulation/testdata.ts";
import { InvestorInstrument } from "📚/simulation/investor-instrument.ts";
import { Investors } from "📚/repository/mod.ts";

const date = investor.chart.start;
const all: Investors = await community.all();
const investors = all.filter((i) => i.active(date));

Deno.test("Strategy Instance", () => {
  const s = new Strategy(investors);
  assertInstanceOf(s, Strategy);
});

Deno.test("Null Strategy", () => {
  const s = new NullStrategy(investors);
  const positions: Positions = [];
  assertEquals(s.buy(positions, date).length, 0);
  assertEquals(s.sell(positions, date).length, 0);
});

Deno.test("Random Strategy", () => {
  const amount = 1000;
  const s = new RandomStrategy(investors, amount);
  assertEquals(s.buy([], date).length, 1);
  assertEquals(s.sell([], date).length, 0);
});

Deno.test("Exit Strategy", () => {
  const position = new Position(new InvestorInstrument(investor), 1, 1000);
  const portfolio: Positions = [position];
  const strategy = new ExitStrategy(investors);
  const sell: Positions = strategy.sell(portfolio, date);
  assertEquals(sell.length, 1);
  assertEquals(sell[0], position);
});
