import shuffleArray from "@hugoalh/shuffle-array";
import { assertGreater, assertGreaterOrEqual } from "@std/assert";
import { createMutex } from "@117/mutex";
import { AssetNames, Backend, JournaledAsset } from "@sauber/journal";
import { ChartResults } from "@sauber/etoro-investors";

import { DateFormat, nextDate, Tick, Timeline } from "📚/tick/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Chart, InvestorAssembly } from "📚/repository/mod.ts";
import { Account } from "📚/account/mod.ts";

export type Names = Set<string>;
export type Investors = Array<Investor>;
type Dates = Array<DateFormat>;

/** Handle Community I/O requests to local repository */
export class Community {
  constructor(protected readonly repo: Backend) {}

  /** UserName of owner */
  private async owner(): Promise<string> {
    const account = new Account(this.repo);
    const username = await account.username();
    return username;
  }

  /** List of all dates in repo */
  private dates(): Promise<Dates> {
    return this.repo.dirs();
  }

  /** Identify all investor names on a date */
  private async namesByDate(date: DateFormat): Promise<Names> {
    const assets: AssetNames = await (await this.repo.sub(date)).names();
    const valid = /(chart|portfolio|stats)$/;

    // Catalog which file type exist for each investor name
    const names = new Set<string>();
    assets.values()
      .filter((assetname: string) => assetname.match(valid) != null)
      .forEach((assetname: string) => {
        const [name, _type] = assetname.split(".");
        names.add(name);
      });
    // Don't include portfolio owner
    const owner: string = await this.owner();
    names.delete(owner);
    return names;
  }

  /** List of investor names available at tick */
  public async namesByTick(tick: Tick): Promise<Names> {
    const date = (await this.timeline()).date(tick);
    return this.namesByDate(date);
  }

  /** Unique set of names across all dates */
  public async allNames(): Promise<Names> {
    const dates: Dates = await this.dates();
    const allNames: Names[] = await Promise.all(
      dates.map((date) => this.namesByDate(date)),
    );

    const merged = new Set<string>();
    for (const names of allNames) {
      for (const name of names) {
        merged.add(name);
      }
    }
    return merged;
  }

  /** A set of investor names */
  public async samples(count: number): Promise<Names> {
    const all: Names = await this.allNames();
    const some: Names = new Set<string>(shuffleArray([...all]).slice(0, count));
    return some;
  }

  /** The first directory where names exists */
  private async startDate(): Promise<DateFormat> {
    const dates: Dates = await this.dates();
    for (const date of [...dates]) {
      if ((await this.namesByDate(date)).size) return date;
    }
    // return null;
    throw new Error("No community start date");
  }

  /** The first tick where names exists */
  public async start(): Promise<Tick> {
    const timeline = await this.timeline();
    const date = await this.startDate();
    return timeline.tick(date);
  }

  private _timeline: Timeline | undefined;
  private readonly _timeline_lock = createMutex();
  /** Earliest date in any chart */
  // TODO: This is still loaded too many times. Convert to singleton.
  public async timeline(): Promise<Timeline> {
    if (this._timeline) return this._timeline;
    await this._timeline_lock.acquire();
    try {
      if (this._timeline) return this._timeline;

      console.log("Finding earliest chart date...");
      const folderStart: DateFormat | null = await this.startDate();
      if (!folderStart) throw new Error("No start date found in repo");
      let chartStart: DateFormat | undefined;
      const names: Names = await this.namesByDate(folderStart);
      for (const UserName of names) {
        const chartAsset = new JournaledAsset<ChartResults>(
          UserName + ".chart",
          this.repo,
        );
        // TODO: Read all charts in parallel
        const lastData: ChartResults = await chartAsset.retrieve(folderStart);
        const chart = new Chart(lastData);
        const first = chart.start;
        if (!chartStart || first < chartStart) chartStart = first;
      }
      if (!chartStart) throw new Error("No chart start date found");
      this._timeline = new Timeline(chartStart);
      return this._timeline;
    } finally {
      this._timeline_lock.release();
    }
  }

  /** The last directory where names exists */
  private async endDate(): Promise<DateFormat> {
    const dates: Dates = await this.dates();
    for (const date of [...dates].reverse()) {
      if ((await this.namesByDate(date)).size) return date;
    }
    // return null;
    throw new Error("No community end date");
  }

  /** Last tick where name exists */
  public async end(): Promise<Tick> {
    const endDate: DateFormat = await this.endDate();
    const timeline = await this.timeline();
    return timeline.tick(endDate);
  }

  /** Test if investor is active at date */
  private async activeName(
    username: string,
    date: DateFormat,
  ): Promise<boolean> {
    const investor = await this.investor(username);
    const timeline = await this.timeline();
    const tick = timeline.tick(date);
    return investor.isActive(tick);
  }

  /** Names of investors where date is within active range */
  public async active(tick: Tick): Promise<Names> {
    const timeline = await this.timeline();
    const date = timeline.date(tick);
    const allNames: Names = await this.allNames();
    const validVector: Array<boolean> = await Promise.all(
      allNames.values().map((name) => this.activeName(name, date)),
    );
    const validNames: string[] = [...allNames].filter(
      (_name, index) => validVector[index],
    );
    const names: Names = new Set<string>(validNames);
    return names;
  }

  protected _loaded: Record<string, Investor> = {};
  /** Create and cache Investor object */
  public async investor(username: string): Promise<Investor> {
    const key = username.toLowerCase();
    if (!(key in this._loaded)) {
      // const start: DateFormat = await this.chartStart();
      const timeline = await this.timeline();
      // const start: DateFormat = timeline.date(0);
      const assembly = new InvestorAssembly(username, this.repo, timeline);
      const investor: Investor = await assembly.investor();
      assertGreaterOrEqual(investor.start, 0);
      assertGreater(investor.end, investor.start);
      console.log(
        `Loaded investor ${username} with chart range [${investor.start};${investor.end}]`,
      );
      this._loaded[key] = investor;
    }
    return this._loaded[key];
  }

  /** Get one random investor */
  public async any(): Promise<Investor> {
    const names: Names = await this.allNames();
    const name: string =
      Array.from(names)[Math.floor(Math.random() * names.size)];
    return this.investor(name);
  }

  /** Load a list of investors from list of names */
  public load(names: Names): Promise<Investors> {
    return Promise.all(Array.from(names).map((name) => this.investor(name)));
  }

  /** All investor */
  public async all(): Promise<Investors> {
    const names: Names = await this.allNames();
    return this.load(names);
  }

  /** Investors on latest date */
  public async latest(): Promise<Investors> {
    const end: DateFormat | null = await this.endDate();
    if (!end) return [];
    // Charts are two days old
    const chartend: DateFormat = nextDate(end, -2);
    const names: Names = await this.namesByDate(chartend);
    return this.load(names);
  }
}
