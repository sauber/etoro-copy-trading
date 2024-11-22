import { assertEquals, assertInstanceOf } from "@std/assert";
import { Asset } from "📚/storage/mod.ts";
import { Community } from "📚/repository/community.ts";
import { HeapBackend } from "📚/storage/heap-backend.ts";
import { nextDate, today } from "📚/time/mod.ts";
import { repo as temprepo } from "📚/repository/testdata.ts";
import { Investor } from "📚/investor/mod.ts";

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

  console.log({ date });

  await t.step("incomplete write", async () => {
    await Promise.all([
      new Asset(`${name}.chart`, repo).store({}),
      new Asset(`${name}.portfolio`, repo).store({}),
    ]);
    const names: string[] = await community.namesByDate(date);
    assertEquals(names, [name]);
  });

  await t.step("complete write", async () => {
    await Promise.all([
      new Asset(`${name}.chart`, repo).store({
        simulation: {
          oneYearAgo: {
            chart: [
              { timestamp: nextDate(date, -1), equity: 10000 },
              { timestamp: date, equity: 10001 },
            ],
          },
        },
      }),
      new Asset(`${name}.stats`, repo).store({ Data: { CustomerId: name } }),
      new Asset(`${name}.portfolio`, repo).store({ AggregatedMirrors: [] }),
    ]);
    const names: string[] = await community.namesByDate(date);
    assertEquals(names, [name]);
  });

  await t.step("all names", async () => {
    const names: string[] = await community.allNames();
    assertEquals(names, [name]);
  });

  await t.step("last date", async () => {
    const d = await community.end();
    assertEquals(d, date);
  });
});

Deno.test("Disk repo", async (t) => {
  const community: Community = new Community(temprepo);

  // await t.step("invalid names", async () => {
  //   const names: string[] = await community.invalidNames();
  //   assertEquals(names.length, 0);
  // });

  await t.step("all names", async () => {
    const names: Investor[] = await community.all();
    assertEquals(names.length, 26);
  });
});
