import { assertEquals, assertInstanceOf } from "@std/assert";
import { community } from "./testdata.ts";
import type { Investors } from "./testdata.ts";
import { Simulation } from "./simulation.ts";
import { NullStrategy, RandomStrategy } from "./strategy.ts";
import { DateFormat, diffDate } from "📚/time/mod.ts";

const [start, end] = (await Promise.all([
  community.start(),
  community.end(),
])) as [DateFormat, DateFormat];

const investors: Investors = await community.all();

Deno.test("Instance", () => {
  const sim = new Simulation(start, end, investors, new NullStrategy([]));
  assertInstanceOf(sim, Simulation);
});

Deno.test("Null Strategy", async () => {
  const sim = new Simulation(start, end, investors, new NullStrategy([]));
  await sim.run();
  const chart = sim.chart;
  const days = 1 + diffDate(start, end);
  assertEquals(chart.gain(start, end), 0);
  assertEquals(chart.length, days);
});

Deno.test.ignore("Random Strategy", async () => {
  const stop = "2022-04-27";
  const sim = new Simulation(
    start,
    stop,
    investors,
    new RandomStrategy(investors, 1000),
  );
  await sim.run();
  sim.book.export.digits(2).print("Random Strategy");
  const positions: number = sim.book.portfolio.length;
  assertEquals(positions, 0);
});
