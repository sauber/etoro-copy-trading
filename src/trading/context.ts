import { Backend } from "@sauber/journal";
import { createMutex, Mutex } from "@117/mutex";
import { DateFormat, diffDate, nextDate, Tick, Timeline } from "📚/tick/mod.ts";
import {
  Amount,
  BuyOrder,
  Instrument,
  OpenPosition,
  Portfolio,
  Position,
  SellOrder,
  Series,
} from "@sauber/backtest";
import { Config } from "📚/config/mod.ts";
import { Account } from "📚/account/mod.ts";
import { Diary, Investor } from "📚/investor/mod.ts";
import { Mirror } from "📚/repository/mod.ts";
import { Community, Names } from "📚/community/mod.ts";

type Mirrors = Array<Mirror>;
type Journal = Diary<Mirrors>;

export type ParameterData = Record<string, number>;

// Count of days investor data is behind trading date
export const DELAY = 2;

/** Types of values storable in cache */
type CacheValue =
  | BuyOrder[]
  | SellOrder
  | SellOrder[]
  | DateFormat
  | Instrument
  | Instrument[]
  | Investor
  | null
  | Position
  | BuyOrder;

/** Load all data for strategyContext */
export class Context {
  private readonly account: Account;
  private readonly community: Community;

  constructor(private readonly repo: Backend) {
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

  /** Map of ticks and dates */
  private readonly timeline_lock = createMutex();
  private _timeline: Timeline | null = null;
  private async timeline(): Promise<Timeline> {
    if (this._timeline !== null) return this._timeline;
    await this.timeline_lock.acquire();
    try {
      if (this._timeline !== null) return this._timeline;
      const chartStart: DateFormat = await this.community.chartStart();
      this._timeline = new Timeline(chartStart);
      return this._timeline;
    } finally {
      this.timeline_lock.release();
    }
  }

  /** Trading strategy parameters */
  private readonly settings_lock = createMutex();
  private _settings: ParameterData | undefined = undefined;
  public async settings(): Promise<ParameterData> {
    if (this._settings !== undefined) return this._settings;
    await this.settings_lock.acquire();
    try {
      // If settings already loaded, return them
      if (this._settings !== undefined) return this._settings;
      // Load while having lock aquired
      const config = new Config(this.repo);
      const settings: ParameterData =
        (await config.get("trading")) as ParameterData;
      this._settings = settings;
      return settings;
    } finally {
      this.settings_lock.release();
    }
  }

  /** First date of community data */
  private start(): Promise<DateFormat> {
    return this.cache<DateFormat>(
      "start",
      async () => (await this.community.start()) as DateFormat,
    );
  }

  /** Last date of community data */
  private end(): Promise<DateFormat> {
    return this.cache<DateFormat>(
      "end",
      async () => (await this.community.end()) as DateFormat,
    );
  }

  /** Identify date of trading */
  private readonly tradingDate_lock = createMutex();
  private _tradingDate: DateFormat | null = null;
  public async tradingDate(): Promise<DateFormat> {
    if (this._tradingDate !== null) return this._tradingDate;
    await this.tradingDate_lock.acquire();
    try {
      if (this._tradingDate !== null) return this._tradingDate;
      // console.log("Loading TradingDate");
      const repoEnd: DateFormat = await this.end();
      // Desired day of week fo trading
      const weekday: number = (await this.settings()).weekday;
      // const tradingDate: DateFormat = repoEnd
      //   ? dateFromWeekday(repoEnd, weekday)
      //   : NOW;
      // Most recent date with data for trading day of week, upto DELAY days before end of repo
      // Day of week for end of repo
      const repoEndWeekday: number = repoEnd ? new Date(repoEnd).getDay() : 0;
      // Number of days to subtract from repo end to get to desired weekday
      const daysToSubtract: number = (repoEndWeekday - weekday + 7) % 7;
      // Trading date is repo end minus days to subtract
      const tradingDate: DateFormat = nextDate(repoEnd, -daysToSubtract);
      this._tradingDate = tradingDate;
      return tradingDate;
    } finally {
      this.tradingDate_lock.release();
    }
  }

  /** tradingDate as Bar */
  public async tradingTick(): Promise<Tick> {
    const timeline: Timeline = await this.timeline();
    const date: DateFormat = await this.tradingDate();
    return timeline.tick(date);
  }

  /** Total value of account */
  public async value(): Promise<Amount> {
    const value: Amount = await this.account.value();
    if (value == null) throw new Error("Account Value is null");
    return value;
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
  private async investor(username: string): Promise<Investor> {
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

  /** Username of account */
  public async username(): Promise<string> {
    return (await this.account.username());
  }

  /** Investor data for account */
  private async accountInvestor(): Promise<Investor> {
    const username: string = await this.username();
    const investor: Investor = await this.investor(username);
    return investor;
  }

  /** Journal of mirrors of account */
  private async mirrorJournal(): Promise<Journal> {
    const investor: Investor = await this.accountInvestor();
    const mirrors: Journal = investor.mirrors;
    return mirrors;
  }

  /** List of mirrors most recent to trading date */
  private readonly mirrors_lock = createMutex();
  private _mirrors: Mirrors | null = null;
  private async mirrors(): Promise<Mirrors> {
    // Mirrors already generated
    if (this._mirrors !== null) return this._mirrors;

    // Acquire lock
    await this.mirrors_lock.acquire();
    try {
      // Confirm if resolved before lock acquired
      if (this._mirrors !== null) return this._mirrors;

      // Resolve mirrors
      const trading: DateFormat = await this.tradingDate();
      const journal: Journal = await this.mirrorJournal();
      const dates: Array<DateFormat> = journal.dates;
      const start: DateFormat = dates[0];
      const recent: DateFormat = dates.findLast((d) => d <= trading) || start;
      const mirrors: Mirrors = journal.before(recent);
      // console.log("Mirrors loaded from date", recent, mirrors.length);
      this._mirrors = mirrors;
      return mirrors;
    } finally {
      this.mirrors_lock.release();
    }
  }

  /** Start date of position.
   * If previous list of mirrors exists, and mirror is missing, then assume it was opened here.
   * Otherwise assume opened at beginning of time.
   */
  private positionStart(username: string): Promise<DateFormat> {
    return this.cache<DateFormat>(
      "start_" + username,
      async () => {
        const trading = await this.tradingDate();
        const journal = await this.mirrorJournal();
        const priorDates: Array<DateFormat> = journal.dates
          .filter((d) => d < trading).reverse();
        if (priorDates) {
          // Find first date where mirror is no longer included
          for (const date of priorDates) {
            const mirrors = journal.on(date);
            const names: Array<string> = mirrors.map((m) => m.UserName);
            if (!names.includes(username)) return date;
          }
          // No opening date found
        }
        const start: DateFormat = await this.start();
        return start;
      },
    );
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

  /** Data for an investor or null if missing*/
  private mirror(username: string): Promise<Investor | null> {
    return this.cache<Investor | null>(
      "mirror_" + username,
      async () => {
        const names: Set<string> = await this.names();
        return names.has(username) ? await this.investor(username) : null;
      },
    );
  }

  /** Convert investor to instrument */
  private instrument(username: string): Promise<Instrument> {
    return this.cache<Instrument>(
      "instrument_" + username,
      async () => {
        const investor: Investor | null = await this.mirror(username);
        if (investor) {
          return investor;
        } else {
          // Create placeholder instrument
          const start: DateFormat = await this.start();
          const end: DateFormat = await this.end();
          const series: Series = new Float32Array(diffDate(start, end) + 1)
            .fill(10000);
          const timeline: Timeline = await this.timeline();
          const startChart: DateFormat = timeline.date(0);
          const startTick: Tick = diffDate(startChart, start);
          return new Instrument(series, startTick, username, "Placeholder");
        }
      },
    );
  }

  /** Position for mirror */
  // private positionid: PositionID = 0;
  private async position(
    username: string,
    amount: Amount,
  ): Promise<OpenPosition> {
    const timeline = await this.timeline();
    return this.cache<OpenPosition>(
      "position_" + username,
      async () => {
        const instrument = await this.instrument(username);
        const startDate: DateFormat = await this.positionStart(username);
        const startTick: Tick = timeline.tick(startDate);
        const endTick: Tick = instrument.end;
        // console.log({
        //   startDate,
        //   startTick,
        //   endTick,
        //   endDate: timeline.date(endTick),
        // });
        // console.log(instrument);
        const startPrice: number = instrument.price(startTick);
        const endPrice: number = instrument.price(endTick);
        const startAmount: Amount = startPrice / endPrice * amount;
        const quantity: number = startAmount / startPrice;
        const position: Position = new OpenPosition(
          instrument,
          startTick,
          startAmount,
          quantity,
        );
        // console.log(
        //   "Position loaded for",
        //   username,
        //   "start",
        //   startDate,
        //   "start tick",
        //   startTick,
        //   "end tick",
        //   endTick,
        //   "amount",
        //   amount,
        // );
        return position;
      },
    );
  }

  /** All mirrors of account */
  private readonly positions_lock = createMutex();
  private _portfolio: Portfolio | null = null;
  public async portfolio(): Promise<Portfolio> {
    if (this._portfolio !== null) return this._portfolio;
    const tick: Tick = await this.tradingTick();
    // console.log("Loading positions for tick", tick);
    await this.positions_lock.acquire();
    try {
      if (this._portfolio !== null) return this._portfolio;

      const mirrors: Mirrors = await this.mirrors();
      // console.log("Mirrors for portfolio", mirrors.length);
      const scale: number = (await this.value()) / 100;
      // console.log("Scaling positions % by", scale);
      const positions: OpenPosition[] = await Promise.all(
        mirrors.map((m: Mirror) => this.position(m.UserName, m.Value * scale)),
      );

      // Confirm position has data, otherwise it's probably closed
      const open: OpenPosition[] = [];
      for (const p of positions) {
        if (p.instrument.end >= (tick - DELAY)) open.push(p);
        else {console.warn(
            "Warning: Position",
            p.instrument.symbol,
            "has no data at bar",
            tick - DELAY,
            "latest is",
            p.instrument.end,
          );}
      }

      this._portfolio = new Portfolio(open);
      return this._portfolio;
    } finally {
      this.positions_lock.release();
    }
  }

  /** Amount available for investing, ie. total value minus value of positions */
  private readonly amount_lock = createMutex();
  private _amount: Amount | null = null;
  private async amount(): Promise<Amount> {
    if (this._amount !== null) return this._amount;
    await this.amount_lock.acquire();
    try {
      if (this._amount !== null) return this._amount;

      const tick: Tick = await this.tradingTick();
      const value: Amount = await this.value();
      const portfolio: Portfolio = await this.portfolio();
      const invested: Amount = portfolio.value(tick);
      const amount: Amount = value - invested;
      this._amount = amount;
      return amount;
    } finally {
      this.amount_lock.release();
    }
  }

  /** Load instruments by list of investor names */
  private async instruments(names: Names): Promise<Instrument[]> {
    const instruments: Instrument[] = await Promise.all(
      Array.from(names).map((name: string) => this.instrument(name)),
    );
    return instruments;
  }

  public async anyInstrument(): Promise<Instrument> {
    const names = await this.names();
    return this.instrument(Array.from(names)[0]);
  }

  /** Investors available on (upto EXTEND days before) trading date */
  public tradingInstruments(): Promise<Instrument[]> {
    return this.cache<Instrument[]>(
      "trading_instruments",
      async () => {
        const tradingDate: DateFormat = await this.tradingDate();
        const activeDate: DateFormat = nextDate(tradingDate, -DELAY);
        const names: Names = await this.community.active(activeDate);
        return this.instruments(names);
      },
    );
  }

  /** Investors available for purchase */
  // private purchaseOrders(): Promise<BuyOrder[]> {
  //   return this.cache<BuyOrder[]>(
  //     "po",
  //     async () => {
  //       const instruments: Instrument[] = await this.tradingInstruments();
  //       const total: Amount = await this.amount();
  //       const amount: Amount = total / instruments.length;
  //       const purchaseOrders: BuyOrder[] = instruments.map(
  //         (instrument: Instrument) => ({ instrument, amount }),
  //       );
  //       return purchaseOrders;
  //     },
  //   );
  // }

  /** Investors in Portfolio */
  // private closeOrders(): Promise<SellOrder[]> {
  //   return this.cache<SellOrder[]>(
  //     "co",
  //     async () => {
  //       const positions: OpenPosition[] = await this.positions();
  //       const closeOrders: SellOrder[] = positions.map(
  //         (position: OpenPosition) => ({
  //           position,
  //           confidence: 1,
  //           reason: "Close",
  //         }),
  //       );
  //       return closeOrders;
  //     },
  //   );
  // }

  // public async strategyContext(): Promise<StrategyContext> {
  //   const [bar, value, amount, purchaseorders, closeorders, positions] =
  //     await Promise.all(
  //       [
  //         this.tradingTick(),
  //         this.value(),
  //         this.amount(),
  //         this.purchaseOrders(),
  //         this.closeOrders(),
  //         this.positions(),
  //       ],
  //     ) as [Tick, Amount, Amount, PurchaseOrders, CloseOrders, Positions];
  //   return { bar, value, amount, purchaseorders, closeorders, positions };
  // }
}
