import {
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import { InvestorInstrument } from "📚/trading/investor-instrument.ts";
import { investor } from "📚/trading/testdata.ts";
import { Bar, Price } from "@sauber/backtest";

Deno.test("Instance", () => {
  assertInstanceOf(new InvestorInstrument(investor), InvestorInstrument);
});

Deno.test("Start is unchanged", () => {
  const start: Bar = investor.chart.start;
  const instr = new InvestorInstrument(investor);
  const instrumetStart: Bar = instr.start;
  assertEquals(instrumetStart, start);
});

Deno.test("Extend End", () => {
  const offset = 2;
  const end: Bar = investor.chart.end;
  const instr = new InvestorInstrument(investor);
  const instrumetEnd: Bar = instr.end;
  assertEquals(instrumetEnd, end - offset);
});

Deno.test("Confirm price availability to offset", () => {
  const investorEnd: Bar = investor.chart.end;
  const price: Price = investor.chart.last;
  const instr = new InvestorInstrument(investor);
  const instrumetEnd: Bar = instr.end;

  for (let bar = investorEnd; bar >= instrumetEnd; bar--) {
    assertAlmostEquals(instr.price(bar), price);
  }
});
