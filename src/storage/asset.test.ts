import { assertEquals, assertInstanceOf } from "@std/assert";
import { Asset } from "📚/storage/mod.ts";
import { HeapBackend } from "📚/storage/heap-backend.ts";

const assetName = "MyAsset";
type AssetContent = { foo: number; bar: string };
const repo = new HeapBackend();

Deno.test("Instance", () =>
  assertInstanceOf(new Asset(assetName, repo), Asset));

Deno.test("Store / Retrieve", async () => {
  const asset = new Asset<AssetContent>(assetName, repo);
  assertEquals(await asset.exists(), false);

  const data: AssetContent = { foo: 1, bar: "a" };
  asset.store(data);
  assertEquals(await asset.exists(), true);

  const loaded = await asset.retrieve();
  assertEquals(loaded, data);
});
