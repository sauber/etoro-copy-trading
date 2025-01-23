import { assertEquals, assertInstanceOf } from "@std/assert";
import { InvestorInstrument } from "📚/trading/investor-instrument.ts";
import { investor } from "📚/trading/testdata.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new InvestorInstrument(investor), InvestorInstrument);
});

Deno.test("Properties", () => {
  const instrument = new InvestorInstrument(investor);
  assertEquals(instrument.end, investor.chart.end);
  assertEquals(instrument.name, investor.FullName);
  assertEquals(instrument.symbol, investor.UserName);
  assertEquals(instrument.investor, investor);
});
