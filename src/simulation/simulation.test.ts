import { assertEquals, assertInstanceOf } from "@std/assert";
import { DateFormat, diffDate } from "📚/time/mod.ts";
import { community } from "📚/simulation/testdata.ts";
import type { Investors } from "📚/simulation/testdata.ts";
import { Simulation } from "📚/simulation/simulation.ts";
import {
  NullStrategy,
  Positions,
  RandomStrategy,
} from "📚/simulation/strategy.ts";

const [start, end] = (await Promise.all([
  community.start(),
  community.end(),
])) as [DateFormat, DateFormat];

const investors: Investors = await community.all();

Deno.test("Instance", () => {
  const sim = new Simulation(start, end, investors, new NullStrategy([]));
  assertInstanceOf(sim, Simulation);
});

Deno.test("Null Strategy", () => {
  const sim = new Simulation(start, end, investors, new NullStrategy([]));
  sim.run();
  const chart = sim.chart;
  const days = 1 + diffDate(start, end);
  assertEquals(chart.gain(start, end), 0);
  assertEquals(chart.length, days);
});

Deno.test.ignore("Random Strategy", () => {
  const stop = "2022-04-27";
  const sim = new Simulation(
    start,
    stop,
    investors,
    new RandomStrategy(investors, 1000),
  );
  sim.run();
  console.log(sim.account.statement);
  const positions: Positions = sim.account.positions;
  assertEquals(positions.length, 0);
});
