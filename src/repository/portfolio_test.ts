import { assert, assertEquals, assertInstanceOf } from "@std/assert";
import { Portfolio } from "./portfolio.ts";
import { testAssets } from "./testdata.ts";
import { InvestorId } from "./mod.ts";

const portfolioData = testAssets.portfolio;

Deno.test("Initialization", () => {
  const portfolio = new Portfolio({
    CreditByRealizedEquity: 0,
    CreditByUnrealizedEquity: 0,
    AggregatedMirrors: [],
    AggregatedPositions: [],
    AggregatedPositionsByInstrumentTypeID: [],
    AggregatedPositionsByStockIndustryID: [],
  });
  assertInstanceOf(portfolio, Portfolio);
});

Deno.test("Portfolio", async (t) => {
  const portfolio: Portfolio = new Portfolio(portfolioData);

  await t.step("validate", () => {
    assertEquals(portfolio.validate(), true);
  });

  await t.step("mirrors", () => {
    const inv: InvestorId[] = portfolio.investors;
    assert(inv.length > 0);
  });
});
