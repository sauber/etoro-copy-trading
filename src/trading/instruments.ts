import { Backend } from "@sauber/journal";
import { createMutex, Mutex } from "@117/mutex";
import { Instrument, Series } from "@sauber/backtest";

import { Tick } from "📚/tick/mod.ts";
import { Account } from "📚/account/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Community, Names } from "📚/community/mod.ts";
import { DELAY } from "📚/strategy/mod.ts";

/** Types of values storable in cache */
type CacheValue = Tick | Instrument;

/** Load all data for strategyContext */
export class Instruments {
  private readonly account: Account;
  private readonly community: Community;

  constructor(
    private readonly repo: Backend,
    private readonly tradingTick: Tick,
  ) {
    this.account = new Account(this.repo);
    this.community = new Community(repo);
  }

  /** Load data from repo and cache */
  // TODO: Count hits in cache, and report totals after final use. Perhaps some do not need cache.

  private readonly cached: Record<string, CacheValue> = {};
  private cache_access: number = 0;
  private cache_loaded: Record<string, number> = {};
  private cache_hit: number = 0;
  private async cache<T>(
    key: string,
    loader: () => Promise<CacheValue>,
  ): Promise<T> {
    if (!(key in this.cache)) {
      const value: CacheValue = await loader();
      this.cached[key] = value;
      this.cache_loaded[key] ??= 0;
      this.cache_loaded[key]++;
    } else this.cache_hit++;
    this.cache_access++;

    return this.cached[key] as T;
  }

  /** First date of community data */
  private start(): Promise<Tick> {
    return this.cache<Tick>(
      "start",
      async () => (await this.community.start()),
    );
  }

  /** Last date of community data */
  private end(): Promise<Tick> {
    return this.cache<Tick>(
      "end",
      async () => (await this.community.end()),
    );
  }

  /** A semaphore for each investor */
  private readonly investorSemaphores = new Map<string, Mutex>();
  private investor_semaphore(username: string): Mutex {
    const lock = this.investorSemaphores.get(username);
    if (lock) return lock;
    const created = createMutex();
    this.investorSemaphores.set(username, created);
    return created;
  }

  /** Data for an investor */
  private readonly _investors = new Map<string, Investor>();
  public async investor(username: string): Promise<Investor> {
    const prev = this._investors.get(username);
    if (prev) return prev;

    const lock = this.investor_semaphore(username);
    await lock.acquire();
    if (this._investors.has(username)) {
      const investor: Investor = this._investors.get(username) as Investor;
      return investor;
    }
    try {
      const investor: Investor = await this.community.investor(
        username,
      );
      this._investors.set(username, investor);
      return investor;
    } finally {
      lock.release();
    }
  }

  /** Load list of names */
  private readonly names_lock = createMutex();
  private _names: Set<string> | null = null;
  private async names(): Promise<Set<string>> {
    if (this._names !== null) return this._names;
    // Acquire lock to prevent multiple loads
    // This is needed because names are used in multiple places
    await this.names_lock.acquire();
    try {
      if (this._names !== null) return this._names;
      const names: Set<string> = await this.community.allNames();
      this._names = names;
      return names;
    } finally {
      this.names_lock.release();
    }
  }

  /** Create a placeholder instrument */
  public async placeholder(username: string): Promise<Instrument> {
    const start: Tick = await this.start();
    const end: Tick = await this.end();
    const series: Series = new Float32Array(end - start + 1).fill(10000);
    return new Instrument(series, start, username, "Placeholder");
  }

  /** Load investor or create placeholder if cannot load */
  public instrument(username: string): Promise<Instrument> {
    return this.cache<Instrument>(
      "instrument_" + username,
      async () => {
        const names: Set<string> = await this.names();
        if (names.has(username)) {
          const investor: Investor = await this.investor(username);
          return investor;
        } else {
          return this.placeholder(username);
        }
      },
    );
  }

  /** Investors available on (upto EXTEND days before) trading date */
  public async tradingInstruments(): Promise<Instrument[]> {
    const tradingTick: Tick = this.tradingTick;
    const activeTick: Tick = tradingTick - DELAY;
    const names: Names = await this.community.active(activeTick);
    const instruments: Instrument[] = await Promise.all(
      Array.from(names).map((name: string) => this.instrument(name)),
    );
    return instruments;
  }
}
