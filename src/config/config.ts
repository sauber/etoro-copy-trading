import type { JSONObject, JSONValue } from "../storage/mod.ts";
import { Backend, Asset } from "../storage/mod.ts";

export class Config {
  private static readonly assetname = "config";
  private readonly asset: Asset<JSONObject>;

  constructor(
    private readonly repo: Backend,
    private readonly defaults: JSONObject = {}
  ) {
    this.asset = new Asset<JSONObject>(Config.assetname, repo);
  }

  /** create new Config object with default values */
  public withDefaults(defaults: JSONObject): Config {
    return new Config(this.repo, defaults);
  }

  /** Most recent saved config, or new blank */
  private async last(): Promise<JSONObject> {
    if (await this.asset.exists()) return this.asset.last();
    else return {};
  }

  /** Return a single value */
  public async get(key: string): Promise<JSONValue> {
    // Attempt to read from file
    const data: JSONObject = await this.last();
    if (key in data) return data[key];

    // Defaults defined?
    if (key in this.defaults) return this.defaults[key];

    // Not in file and not in defaults
    return null;
  }

  /** Find most recent config file and store in new folder */
  public async renew(): Promise<void> {
    const data: JSONObject = await this.last();
    return this.asset.store(data);
  }

  /** Set or overwrite a single value */
  public async set(key: string, value: JSONValue): Promise<void> {
    const data: JSONObject = await this.last();
    data[key] = value;
    return this.asset.store(data);
  }
}
