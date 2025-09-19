import { assertEquals, assertInstanceOf } from "@std/assert";
import { testAssets, investorId } from "📚/repository/testdata.ts";
import { FetchHeapBackend } from "./fetch-heap.ts";

Deno.test("Initialization", () => {
  const f: FetchHeapBackend = new FetchHeapBackend(testAssets);
  assertInstanceOf(f, FetchHeapBackend);
});

Deno.test("Fetching", { ignore: false }, async (t) => {
  const fetch: FetchHeapBackend = new FetchHeapBackend(testAssets);

  await t.step("discover", async () => {
    const data = await fetch.discover({});
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
