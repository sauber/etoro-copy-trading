import {
  assertEquals,
  assertGreaterOrEqual,
  assertInstanceOf,
} from "@std/assert";
import { HeapBackend, JournaledAsset } from "@sauber/journal";
import { nextDate, Tick, Timeline, today } from "📚/tick/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { repo as temprepo } from "📚/repository/testdata.ts";
import { Account } from "📚/account/mod.ts";
import { TestCommunity } from "./test-community.ts";
import { Community, Names } from "./community.ts";

Deno.test("Initialization", () => {
  const repo = new HeapBackend();
  const community: Community = new Community(repo);
  assertInstanceOf(community, Community);
});

Deno.test("Heap repo", async (t) => {
  const repo = new HeapBackend();
  const community: Community = new Community(repo);
  const owner = "jane";
  const name = "john";
  const account = new Account(repo);
  await account.setUsername(owner);
  const date = today();
  const tick = 1;

  await t.step("complete write", async () => {
    await Promise.all([
      new JournaledAsset(`${name}.chart`, repo).store({
        simulation: {
          oneYearAgo: {
            chart: [
              { timestamp: nextDate(date, -1), equity: 10000 },
              { timestamp: date, equity: 10001 },
            ],
          },
        },
      }),
      new JournaledAsset(`${name}.stats`, repo).store({
        Data: { CustomerId: name },
      }),
      new JournaledAsset(`${name}.portfolio`, repo).store({
        AggregatedMirrors: [],
      }),
    ]);
    const names: Set<string> = await community.namesByTick(tick);
    assertEquals(names, new Set([name]));
  });

  await t.step("all names", async () => {
    const names: Set<string> = await community.allNames();
    assertEquals(names, new Set([name]));
  });

  await t.step("last tick", async () => {
    const t = await community.end();
    assertEquals(t, tick);
  });
});

Deno.test("Disk repo", async () => {
  const community: Community = new Community(temprepo);

  const names: Names = await community.allNames();
  assertEquals(names.size, 25);
});

Deno.test("Test Investor", async () => {
  const community: Community = new TestCommunity(temprepo);

  const names: Names = await community.samples(1);
  const name: string = [...names][0];
  const investor: Investor = await community.investor(name);
  assertGreaterOrEqual(investor.start, 0);
  assertGreaterOrEqual(investor.end, investor.start);
  assertInstanceOf(investor, Investor);
});

Deno.test("Timeline", async () => {
  const community: Community = new TestCommunity(temprepo);
  const timeline: Timeline = await community.timeline();
  assertEquals(timeline.date(0), "2020-12-01");
});

Deno.test("Active Investors", async () => {
  const community: Community = new TestCommunity(temprepo);
  const last: Tick | null = await community.end() as number;
  const active: Names = await community.active(last);
  assertEquals(active.size, 13);
});
