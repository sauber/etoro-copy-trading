import { assertEquals, assertInstanceOf } from "@std/assert";
import { DiscoverParameters } from "@sauber/etoro-investors";
import { HeapBackend } from "@sauber/journal";

import { blacklist, investorId, testAssets } from "📚/repository/testdata.ts";

import { FetchHeapBackend } from "./fetch-heap.ts";
import { Refresh } from "./refresh.ts";

const discoverFilter: Partial<DiscoverParameters> = {};

Deno.test("Initialize", () => {
  const repo: HeapBackend = new HeapBackend();
  const fetcher: FetchHeapBackend = new FetchHeapBackend(testAssets);
  const refresh: Refresh = new Refresh(
    repo,
    fetcher,
    investorId,
    discoverFilter,
    blacklist,
  );
  assertInstanceOf(refresh, Refresh);
});

Deno.test("Fresh", async (t) => {
  const repo = new HeapBackend();
  const fetcher: FetchHeapBackend = new FetchHeapBackend(testAssets);
  const max = 3;

  await t.step("fetch all", async () => {
    const refresh = new Refresh(
      repo,
      fetcher,
      investorId,
      discoverFilter,
      blacklist,
    );
    const count: number = await refresh.run(max);
    // three charts + own chart + discover
    assertEquals(count, max + 1 + 1);
  });

  await t.step("fetch again", async () => {
    const refresh = new Refresh(
      repo,
      fetcher,
      investorId,
      discoverFilter,
      blacklist,
    );
    console.log("Refresh again");
    const count: number = await refresh.run(max);
    assertEquals(count, max + 1, "Expired charts will try download again");
  });
});
