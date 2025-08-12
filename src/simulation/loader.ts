import { Amount, Bar, Instrument, Instruments, Series } from "@sauber/backtest";
import { Assets } from "📚/assets/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Names } from "📚/community/mod.ts";
import { type DateFormat, diffDate, today } from "@sauber/dates";
import {
  default_parameters,
  type ParameterData,
} from "📚/trading/parameters.ts";
import { createMutex, Mutex } from "@117/mutex";

const NOW: DateFormat = today();

/** Load data to generate Strategy context */
export class Loader {
  constructor(protected readonly assets: Assets) {}

  private readonly semaphores = new Map<string, Mutex>();

  // /** Trading strategy parameters */
  private readonly settings_lock = createMutex();
  private _settings: ParameterData | null = null;
  public async settings(): Promise<ParameterData> {
    if (this._settings !== null) return this._settings;
    await this.settings_lock.acquire();
    try {
      // If settings already loaded, return them
      if (this._settings !== null) return this._settings;
      const settings: ParameterData =
        (await this.assets.config.get("trading")) as ParameterData ||
        default_parameters;
      this._settings = settings;
      return settings;
    } finally {
      this.settings_lock.release();
    }
  }

  // /** First date of community data */
  private start(): Promise<DateFormat> {
    return this.assets.community.start() as Promise<DateFormat>;
  }

  /** Last date of community data */
  private end(): Promise<DateFormat> {
    return this.assets.community.end() as Promise<DateFormat>;
  }

  // /** Load list of names */
  private readonly names_lock = createMutex();
  private _names: Set<string> | null = null;
  private async names(): Promise<Set<string>> {
    if (this._names !== null) return this._names;
    // Acquire lock to prevent multiple loads
    // This is needed because names are used in multiple places
    await this.names_lock.acquire();
    try {
      if (this._names !== null) return this._names;
      const names: Set<string> = await this.assets.community.allNames();
      this._names = names;
      return names;
    } finally {
      this.names_lock.release();
    }
  }

  // /** A semaphore for each investor */
  protected readonly investorSemaphores = new Map<string, Mutex>();
  protected investor_semaphore(username: string): Mutex {
    const lock = this.investorSemaphores.get(username);
    if (lock) return lock;
    const created = createMutex();
    this.investorSemaphores.set(username, created);
    return created;
  }

  // /** Data for an investor */
  protected readonly _investors = new Map<string, Investor>();
  protected async investor(username: string): Promise<Investor> {
    const prev = this._investors.get(username);
    if (prev) return prev;

    const lock = this.investor_semaphore(username);
    await lock.acquire();
    if (this._investors.has(username)) {
      const investor: Investor = this._investors.get(username) as Investor;
      return investor;
    }
    try {
      const investor: Investor = await this.assets.community.investor(
        username,
      );
      console.log("Loaded Real Investor", username);
      this._investors.set(username, investor);
      return investor;
    } finally {
      lock.release();
    }
  }

  // /** Data for an investor or null if missing*/
  private async mirror(username: string): Promise<Investor | null> {
    const names: Set<string> = await this.names();
    return names.has(username) ? await this.investor(username) : null;
  }

  // /** Convert investor to instrument */
  public async instrument(username: string): Promise<Instrument> {
    const investor: Investor | null = await this.mirror(username);
    if (investor) {
      return investor;
    } else {
      // Create placeholder instrument
      const start: DateFormat = await this.start();
      const end: DateFormat = await this.end();
      const series: Series = new Float32Array(diffDate(start, end) + 1)
        .fill(
          10000,
        );
      const bar: Bar = diffDate(end, NOW);
      return new Instrument(series, bar, username, "Placeholder");
    }
  }

  // /** Load instruments by list of investor names */
  private async instruments(names: Names): Promise<Instruments> {
    const instruments: Instruments = await Promise.all(
      Array.from(names).map((name: string) => this.instrument(name)),
    );
    return instruments;
  }

  /** Load a number of random Instrument */
  public async instrumentSamples(count: number): Promise<Instruments> {
    const names: Names = await this.assets.community.samples(count);
    return this.instruments(names);
  }

  /** Target size of positions */
  public async positionSize(): Promise<Amount> {
    const settings: ParameterData = await this.settings();
    const size = settings.position_size;
    if (isNaN(size)) throw new Error("Position Size missing in settings");
    return size;
  }
}
