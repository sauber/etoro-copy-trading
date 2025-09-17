import { assertEquals, assertInstanceOf } from "@std/assert";
import { FetchWebBackend } from "./fetch-web.ts";
import { discoverFilter } from "../repository/testdata.ts";
import { investorId } from "../repository/testdata.ts";

const rate = 5000;

Deno.test("Initialization", () => {
  const f = new FetchWebBackend(rate);
  assertInstanceOf(f, FetchWebBackend);
});

Deno.test.ignore("Fetching", async (t) => {
  const f = new FetchWebBackend(rate);

  await t.step("discover", async () => {
    const data = await f.discover(discoverFilter);
    assertEquals(data.Status, "OK");
  });

  await t.step("chart", async () => {
    const data = await f.chart(investorId);
    assertInstanceOf(data.simulation, Object);
  });

  await t.step("portfolio", async () => {
    const data = await f.portfolio(investorId);
    assertInstanceOf(data.AggregatedPositions, Object);
  });

  await t.step("stats", async () => {
    const data = await f.stats(investorId);
    assertInstanceOf(data.Data, Object);
  });
});
