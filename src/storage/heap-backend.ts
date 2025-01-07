import { Backend } from "./backend.ts";
import type { JSONObject, AssetName, AssetNames } from "./mod.ts";

type Asset = {
  content: JSONObject;
  mtime: number;
};

/** Store data objects in memory */
export class HeapBackend implements Backend {
  private readonly heap: Record<string, Asset> = {};
  private readonly partitions: Record<string, HeapBackend> = {};

  public sub(name: string): Promise<Backend> {
    if (!(name in this.partitions)) this.partitions[name] = new HeapBackend();
    return Promise.resolve(this.partitions[name]);
  }

  public dirs(): Promise<string[]> {
    return Promise.resolve(Object.keys(this.partitions));
  }

  public has(assetname: AssetName): Promise<boolean> {
    return Promise.resolve(assetname in this.heap);
  }

  public store(assetname: AssetName, data: JSONObject): Promise<void> {
    this.heap[assetname] = { content: data, mtime: new Date().getTime() };
    return Promise.resolve();
  }

  public retrieve(assetname: AssetName): Promise<JSONObject> {
    return Promise.resolve(this.heap[assetname].content);
  }

  public age(assetname: string): Promise<number> {
    return Promise.resolve(new Date().getTime() - this.heap[assetname].mtime);
  }

  public names(): Promise<AssetNames> {
    return Promise.resolve(new Set(Object.keys(this.heap)));
  }

  public delete(assetname: string): Promise<void> {
    delete this.heap[assetname];
    return Promise.resolve();
  }

}
