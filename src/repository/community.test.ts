import { assertEquals, assertInstanceOf } from "@std/assert";
import { HeapBackend, JournaledAsset } from "📚/storage/mod.ts";
import { nextDate, today } from "📚/time/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Community, Names } from "📚/repository/community.ts";
import { repo as temprepo } from "📚/repository/testdata.ts";

Deno.test("Initialization", () => {
  const repo = new HeapBackend();
  const community: Community = new Community(repo);
  assertInstanceOf(community, Community);
});

Deno.test("Heap repo", async (t) => {
  const repo = new HeapBackend();
  const community: Community = new Community(repo);
  const name = "john";
  const date = today();

  await t.step("incomplete write", async () => {
    await Promise.all([
      new JournaledAsset(`${name}.chart`, repo).store({}),
      new JournaledAsset(`${name}.portfolio`, repo).store({}),
    ]);
    const names: Set<string> = await community.namesByDate(date);
    assertEquals(names, new Set([name]));
  });

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
    const names: Set<string> = await community.namesByDate(date);
    assertEquals(names, new Set([name]));
  });

  await t.step("all names", async () => {
    const names: Set<string> = await community.allNames();
    assertEquals(names, new Set([name]));
  });

  await t.step("last date", async () => {
    const d = await community.end();
    assertEquals(d, date);
  });
});

Deno.test("Disk repo", async (t) => {
  const community: Community = new Community(temprepo);

  await t.step("all names", async () => {
    const names: Names = await community.allNames();
    assertEquals(names.size, 25);
  });
});

Deno.test("Test Investor", async (t) => {
  const community: Community = new Community(temprepo);

  await t.step("all names", async () => {
    const names: Names = await community.samples(1);
    const name: string = [...names][0];
    const investor: Investor = await community.testInvestor(name);
    assertInstanceOf(investor, Investor);
  });
});
