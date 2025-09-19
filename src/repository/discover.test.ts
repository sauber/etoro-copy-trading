import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertThrows,
} from "@std/assert";
import type { DiscoverResults } from "@sauber/etoro-investors";
import { Discover } from "./discover.ts";
import { testAssets } from "./testdata.ts";
import type { InvestorId } from "./mod.ts";

const data: DiscoverResults = testAssets.discover;

Deno.test("Discover", () => {
  const discover: Discover = new Discover({
    Status: "",
    TotalRows: 0,
    Items: [],
  });
  assertInstanceOf(discover, Discover);
});

Deno.test("validate", () => {
  const discover: Discover = new Discover(data);
  assertEquals(discover.validate(), true);
});

Deno.test("investors", () => {
  const discover: Discover = new Discover(data);
  const investors: InvestorId[] = discover.investors;
  assertEquals(investors.length, 70);
});

Deno.test("Discover invalid", () => {
  assertThrows(
    () => {
      data.TotalRows = 0;
      const discover: Discover = new Discover(data);
      assert(discover.validate());
    },
    Error,
    "TotalRows 0 < 1",
  );
});
