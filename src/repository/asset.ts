import type { DateFormat } from "/utils/time/mod.ts";
import { today } from "📚/utils/time/mod.ts";
import { Backend } from "./backend.ts";
import type { AssetName } from "📚/repository/mod.ts";
import type { JSONObject } from "📚/repository/mod.ts";

/** A named asset in repo on all the dates it is available */
export class Asset<AssetType> {
  constructor(
    private readonly assetname: AssetName,
    private readonly repo: Backend
  ) {}

  /** On which dates is asset available */
  public async dates(): Promise<DateFormat[]> {
    return (await this.repo.dirs()).filter(async (date: DateFormat) => {
      const sub: Backend = await this.repo.sub(date);
      return await sub.has(this.assetname);
    });
  }

  /** At least one date must exist */
  private async validatedDates(): Promise<DateFormat[]> {
    const dates = await this.dates();
    if (dates.length < 1)
      throw new Error(`Asset ${this.assetname} is unavailable`);
    return dates;
  }

  /** Verify if least one date exists */
  public async exists(): Promise<boolean> {
    if ((await this.dates()).length > 0) return true;
    else return false;
  }

  public async store(content: AssetType): Promise<void> {
    const sub: Backend = await this.repo.sub(today());
    return sub.store(this.assetname, content as JSONObject);
  }

  private async retrieve(date: DateFormat): Promise<AssetType> {
    const sub: Backend = await this.repo.sub(date);
    return (await sub.retrieve(this.assetname)) as AssetType;
  }

  public async start(): Promise<DateFormat> {
    const dates: DateFormat[] = await this.validatedDates();
    return dates[0];
  }

  public async end(): Promise<DateFormat> {
    const dates: DateFormat[] = await this.validatedDates();
    return dates.reverse()[0];
  }

  public async first(): Promise<AssetType> {
    return this.retrieve(await this.start());
  }

  public async last(): Promise<AssetType> {
    return this.retrieve(await this.end());
  }

  /** Search for asset no later than date */
  public async before(date: DateFormat): Promise<AssetType> {
    // Available dates
    const dates: DateFormat[] = await this.validatedDates();
    const start: DateFormat = dates[0];
    const end: DateFormat = dates[dates.length - 1];

    // Outside range
    if (date >= end) return this.retrieve(end);
    if (date < start) {
      throw new Error(
        `´Searching for asset before ${date} but first date is ${start}`
      );
    }

    // In range
    for (const available of dates.reverse()) {
      if (available <= date) return this.retrieve(available);
    }

    console.log(this.assetname, { dates, start, end, date });
    throw new Error("This code should never be reached");
  }

  /** Search for asset no sooner than date */
  public async after(date: DateFormat): Promise<AssetType> {
    // Available dates
    const dates: DateFormat[] = await this.validatedDates();
    const start: DateFormat = dates[0];
    const end: DateFormat = dates[dates.length - 1];

    // Outside range
    if (date > end) {
      throw new Error(
        `´Searching for ${this.assetname} after ${date} but latest date is ${end}`
      );
    }
    if (date <= start) return this.retrieve(start);

    // In range
    for (const available of dates) {
      if (available >= date) return this.retrieve(available);
    }

    throw new Error("This code should never be reached");
  }
}
