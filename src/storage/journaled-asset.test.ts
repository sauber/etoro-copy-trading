import { assertEquals, assertInstanceOf } from "@std/assert";
import { type DateFormat, today } from "@sauber/dates";
import { HeapBackend } from "📚/storage/mod.ts";
import { JournaledAsset } from "📚/storage/journaled-asset.ts";

type TestAsset = {
  name: string;
  id: number;
};

const content: TestAsset = {
  name: "foo",
  id: 1,
};

const repo = new HeapBackend();

Deno.test("Blank Initialization", () => {
  const series = new JournaledAsset("", repo);
  assertInstanceOf(series, JournaledAsset);
});

Deno.test("Store and retrieve asset", async (t) => {
  const asset = new JournaledAsset<TestAsset>("", repo);

  await t.step("No initial dates", async () => {
    assertEquals(await asset.dates(), []);
    assertEquals(await asset.exists(), false);
  });

  await t.step("Store data", async () => {
    const date: DateFormat = today();
    await asset.store(content);
    assertEquals(await asset.exists(), true);
    assertEquals(await asset.dates(), [date]);
    assertEquals(await asset.start(), date);
    assertEquals(await asset.end(), date);
    assertEquals(await asset.first(), content);
    assertEquals(await asset.last(), content);
    // assertEquals(await asset.before(date), content);
    // assertEquals(await asset.after(date), content);
  });

  await t.step("Erase data", async () => {
    await asset.erase();
    assertEquals(await asset.dates(), []);
    assertEquals(await asset.exists(), false);
  });
});
