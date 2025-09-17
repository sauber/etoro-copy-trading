import { assertEquals, assertInstanceOf } from "@std/assert";
import { FetchHeapBackend } from "./fetch-heap.ts";
import { testAssets, investorId } from "../repository/testdata.ts";

Deno.test("Initialization", () => {
  const f: FetchHeapBackend = new FetchHeapBackend(testAssets);
  assertInstanceOf(f, FetchHeapBackend);
});

Deno.test("Fetching", { ignore: false }, async (t) => {
  const f: FetchHeapBackend = new FetchHeapBackend(testAssets);

  await t.step("discover", async () => {
    const data = await f.discover({ risk: 1, daily: 1, weekly: 1 });
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
