import {
  Asset,
  Backend,
  type JSONObject,
  type JSONValue,
} from "📚/storage/mod.ts";

export class Config {
  private static readonly assetname = "config";
  private readonly asset: Asset<JSONObject>;

  constructor(
    private readonly repo: Backend,
    private readonly defaults: JSONObject = {},
  ) {
    this.asset = new Asset<JSONObject>(Config.assetname, repo);
  }

  /** Saved config, or new blank */
  private async load(): Promise<JSONObject> {
    return (await this.asset.exists()) ? this.asset.retrieve() : {};
  }

  /** Return a single value */
  public async get(key: string): Promise<JSONValue> {
    // Attempt to read from file
    const data: JSONObject = await this.load();
    if (key in data) return data[key];

    // Defaults defined?
    if (key in this.defaults) return this.defaults[key];

    // Not in file and not in defaults
    return null;
  }

  /** Set or overwrite a single value */
  public async set(key: string, value: JSONValue): Promise<void> {
    const data: JSONObject = await this.load();
    data[key] = value;
    return this.asset.store(data);
  }
}
