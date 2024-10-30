import { Backend } from "./backend.ts";
import type { DateFormat } from "../time/mod.ts";
import type { AssetName, AssetNames } from "./mod.ts";
import { Asset } from "./asset.ts";

/** 
 * Store assets by date 
 * TODO: Most likely this class is not needed. A community class will scan for investors, instead.
 */
export class Journal {
  constructor(private readonly repo: Backend){}

  /** A journaled asset by name */
  public asset<T>(assetname: AssetName): Asset<T> {
    return new Asset(assetname, this.repo);
  }

  /** List of all dates */
  public dates(): Promise<DateFormat[]> {
    return this.repo.dirs();
  }
  
  /** Last date */
  public async end(): Promise<DateFormat> {
    const dates: DateFormat[] = await this.dates();
    return dates[dates.length-1];
  }

  /** List of all asset names available on a certain date */
  public async assetsByDate(date: DateFormat): Promise<AssetNames> {
    const sub: Backend = await this.repo.sub(date);
    return sub.names();
  }

  /** List af all uniq assetnames across all dates */
  public async names(): Promise<AssetNames> {
    const dates: DateFormat[] = await this.dates();
    const uniq = new Set<AssetName>();
    for ( const date of dates ) {
      const names: AssetNames = await this.assetsByDate(date);
      for ( const name of names ) uniq.add(name);
    }
    const list = Array.from(uniq);
    return list;
  }
}
