import {
  Asset,
  Backend,
  type StorableObject,
  type StorableValue,
} from "@sauber/journal";

export class Config {
  private static readonly assetname = "config";
  private readonly asset: Asset<StorableObject>;

  constructor(
    private readonly repo: Backend,
    private readonly defaults: StorableObject = {},
  ) {
    this.asset = new Asset<StorableObject>(Config.assetname, repo);
  }

  /** Saved config, or new blank */
  private async load(): Promise<StorableObject> {
    return (await this.asset.exists()) ? this.asset.retrieve() : {};
  }

  /** Return a single value */
  public async get(key: string): Promise<StorableValue> {
    // Attempt to read from file
    const data: StorableObject = await this.load();
    if (key in data) return data[key];

    // Defaults defined?
    if (key in this.defaults) return this.defaults[key];

    // Not in file and not in defaults
    return null;
  }

  /** Set or overwrite a single value */
  public async set(key: string, value: StorableValue): Promise<void> {
    const data: StorableObject = await this.load();
    data[key] = value;
    return this.asset.store(data);
  }
}
