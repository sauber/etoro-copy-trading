import {
  assertArrayIncludes,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import { LimitStrategy, Strategy } from "📚/simulation/strategy.ts";
import { community, investor } from "📚/simulation/testdata.ts";
import { Investors } from "📚/repository/mod.ts";

const date = investor.chart.start;
const all: Investors = await community.all();
const active = all.filter((i) => i.active(date));

Deno.test("Strategy Instance", () => {
  const s = new Strategy();
  assertInstanceOf(s, Strategy);
  assertEquals(s.buy(), []);
  assertEquals(s.sell(), []);
});

Deno.test("Prepend", () => {
  const child = new Strategy();
  const parent = new Strategy();
  const chain = child.prepend(parent);
  assertEquals(chain, child);
  assertEquals(chain.buy(), []);
  assertEquals(chain.sell(), []);
});

Deno.test("Append", () => {
  const child = new Strategy();
  const parent = new Strategy();
  const chain = parent.append(child);
  assertEquals(chain, child);
  assertEquals(chain.buy(), []);
  assertEquals(chain.sell(), []);
});

Deno.test("Random Strategy", () => {
  const s = new Strategy({ investors: active }).random();
  assertArrayIncludes([0, 1], [s.buy().length]);
  assertEquals(s.sell(), []);
});

Deno.test("Limit Strategy", () => {
  const s = new LimitStrategy(5);
  assertEquals(s.buy(), []);
  assertEquals(s.sell(), []);
});

// Deno.test("Null Strategy", () => {
//   const s = new NullStrategy(investors);
//   const positions: Positions = [];
//   assertEquals(s.buy(positions, date).length, 0);
//   assertEquals(s.sell(positions, date).length, 0);
// });

// Deno.test("Active Strategy", () => {
//   const s = new ActiveStrategy(investors, date);
//   const positions: Positions = [];
//   assertEquals(s.buy(positions, date).length, 0);
//   assertEquals(s.sell(positions, date).length, 0);
// });

// Deno.test("Exit Strategy", () => {
//   const position = new Position(new InvestorInstrument(investor), 1, 1000);
//   const portfolio: Positions = [position];
//   const strategy = new ExitStrategy(investors);
//   const sell: Positions = strategy.sell(portfolio, date);
//   assertEquals(sell.length, 1);
//   assertEquals(sell[0], position);
// });
