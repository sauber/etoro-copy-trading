import { Backend } from "📚/storage/backend.ts";
import { AssetNames, JSONObject } from "./mod.ts";

export class CachingBackend implements Backend {
  constructor(private readonly parent: Backend) {}

  private readonly _sub: Record<string, Backend> = {};
  public async sub(partition: string): Promise<Backend> {
    if (!(partition in this._sub))
      this._sub[partition] = new CachingBackend(
        await this.parent.sub(partition)
      );
    return this._sub[partition];
  }

  private _dirs: string[] | null = null;
  public async dirs(): Promise<string[]> {
    if (this._dirs === null) this._dirs = await this.parent.dirs();
    return this._dirs;
  }

  private _names: string[] | null = null;
  public async names(): Promise<AssetNames> {
    if (this._names === null) this._names = await this.parent.names();
    return this._names;
  }

  public async store(assetname: string, data: JSONObject): Promise<void> {
    await this.parent.store(assetname, data);
    this._names = null;
    return;
  }

  private readonly _assets: Record<string, JSONObject> = {};
  public async retrieve(assetname: string): Promise<JSONObject> {
    if (!(assetname in this._assets))
      this._assets[assetname] = await this.parent.retrieve(assetname);
    return this._assets[assetname];
  }

  public async has(assetname: string): Promise<boolean> {
    const names: AssetNames = await this.names();
    return names.includes(assetname);
  }

  private readonly _age: Record<string, number> = {};
  public async age(assetname: string): Promise<number> {
    if (!(assetname in this._age))
      this._age[assetname] = await this.parent.age(assetname);
    return this._age[assetname];
  }

  public async delete(assetname: string): Promise<void> {
    await this.parent.delete(assetname);
    delete this._assets[assetname];
    delete this._age[assetname];
    this._names = null;
  }
}
