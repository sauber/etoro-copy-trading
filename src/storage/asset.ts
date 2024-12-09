import { Backend, JSONObject } from "📚/storage/mod.ts";

/** A storable asset */
export class Asset<AssetType> {
  constructor(
    private readonly assetname: string,
    private readonly repo: Backend,
  ) {}

  public exists(): Promise<boolean> {
    return this.repo.has(this.assetname);
  }

  public async retrieve(): Promise<AssetType> {
    return (await this.repo.retrieve(this.assetname)) as AssetType;
  }

  public store(content: AssetType): Promise<void> {
    return this.repo.store(this.assetname, content as JSONObject);
  }
}
