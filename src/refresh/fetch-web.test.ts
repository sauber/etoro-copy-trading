import { assertEquals, assertInstanceOf } from "@std/assert";
import { DiscoverParameters } from "@sauber/etoro-investors";
import { investorId } from "📚/repository/testdata.ts";
import { FetchWebBackend } from "./fetch-web.ts";

const rate = 5000;

const discoverFilter: Partial<DiscoverParameters> = {};

Deno.test("Initialization", () => {
  const f = new FetchWebBackend(rate);
  assertInstanceOf(f, FetchWebBackend);
});

Deno.test.ignore("Fetching", async (t) => {
  const fetch = new FetchWebBackend(rate);

  await t.step("discover", async () => {
    const data = await fetch.discover(discoverFilter);
    assertEquals(data.Status, "OK");
  });

  await t.step("chart", async () => {
    const data = await fetch.chart(investorId);
    assertInstanceOf(data.simulation, Object);
  });

  await t.step("portfolio", async () => {
    const data = await fetch.portfolio(investorId);
    assertInstanceOf(data.AggregatedPositions, Object);
  });

  await t.step("stats", async () => {
    const data = await fetch.stats(investorId);
    assertInstanceOf(data.Data, Object);
  });
});
