import type { AssetName, AssetNames, JSONObject } from "./mod.ts";
import { Backend } from "📚/storage/mod.ts";
import {
  age,
  dirs,
  exists,
  files,
  mkdir,
  read,
  remove,
  write,
} from "📚/storage/files.ts";
import { join, parse } from "@std/path";

/** Store investor objects on disk */
export class DiskBackend implements Backend {
  constructor(private readonly _path: string) {}

  protected path(): Promise<string> {
    return Promise.resolve(this._path);
  }

  /** Convert assetname to filename */
  private readonly normalized: Record<string, string> = {};
  protected async filename(assetname: string): Promise<string> {
    if (!(assetname in this.normalized)) {
      this.normalized[assetname] = await join(
        await this.path(),
        assetname + ".json",
      );
    }
    return this.normalized[assetname];
  }

  /** Convert filename to assetname */
  protected assetname(filename: string): string {
    return parse(filename).name;
  }

  public async sub(partition: string): Promise<DiskBackend> {
    return new DiskBackend(join(await this.path(), partition));
  }

  public async dirs(): Promise<string[]> {
    return dirs(await this.path());
  }

  public async store(assetname: AssetName, data: JSONObject): Promise<void> {
    // Ensure dir exists
    const dir: string = await this.path();
    if (!(await exists(dir))) await mkdir(dir);

    // Write file
    return write(await this.filename(assetname), JSON.stringify(data));
  }

  public async retrieve(assetname: AssetName): Promise<JSONObject> {
    const filename: string = await this.filename(assetname);
    const content: string = await read(filename);
    try {
      const data: JSONObject = JSON.parse(content);
      return data;
    } catch (err) {
      console.log(filename, err);
      return {};
    }
  }

  public async has(assetname: AssetName): Promise<boolean> {
    const result: boolean = await exists(await this.filename(assetname));
    return result;
  }

  public async age(assetname: AssetName): Promise<number> {
    const filename: string = await this.filename(assetname);
    return age(filename);
  }

  public async names(): Promise<AssetNames> {
    const path: string = await this.path();
    try {
      const filenames: string[] = await files(path);
      const assetnames: string[] = filenames.map((FileName: string) =>
        this.assetname(FileName)
      );
      return assetnames;
    } catch (_err) {
      return [];
    }
  }

  public async delete(assetname: string): Promise<void> {
    const filename: string = await this.filename(assetname);
    return remove(filename);
  }
}
