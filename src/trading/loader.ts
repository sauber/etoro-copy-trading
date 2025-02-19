import {
  Amount,
  Bar,
  Buffer,
  CloseOrders,
  Instrument,
  Instruments,
  Position,
  PositionID,
  Positions,
  Price,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { Assets } from "📚/assets/mod.ts";
import {
  DateFormat,
  dateFromWeekday,
  dateToBar,
  diffDate,
  nextDate,
  today,
} from "📚/time/mod.ts";
import { Mirror, Names } from "📚/repository/mod.ts";
import { Diary, Investor } from "📚/investor/mod.ts";
import { sum } from "📚/math/statistics.ts";
import { InvestorRanking } from "📚/ranking/mod.ts";
import {
  CascadeStrategy,
  FutureStrategy,
  RoundingStrategy,
  StopLossStrategy,
  UnionStrategy,
} from "📚/strategy/mod.ts";
import { Timing, WeekdayStrategy } from "📚/timing/mod.ts";
import { InvestorInstrument } from "📚/trading/investor-instrument.ts";
import {
  default_parameters,
  type ParameterData,
} from "📚/trading/parameters.ts";
import { Policy } from "📚/trading/policy.ts";
import { makeRanker, makeTimer } from "📚/trading/raters.ts";
import { Semaphore } from "semaphore";

const NOW: DateFormat = today();

// Count of days investor data is behind trading date
const EXTEND = 2;

type CacheValue =
  | Amount
  | Bar
  | CloseOrders
  | DateFormat
  | Instrument
  | Instruments
  | Investor
  | Mirrors
  | Mirror
  | null
  | ParameterData
  | Position
  | Positions
  | PurchaseOrders;
type Mirrors = Array<Mirror>;
type Journal = Diary<Mirrors>;

/** Load data to generate Strategy context */
export class Loader {
  constructor(private readonly assets: Assets) {}

  private readonly semaphores = new Map<string, Semaphore>();

  /** Load data from repo and cache */
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
      // if ( this.cache_loaded[key] > 1 ) console.log("Cache reload", this.cache_loaded[key], key);
    } else this.cache_hit++;
    this.cache_access++;
    // console.log(`Cache create/access: ${this.cache_loaded[key]}/${this.cache_access}`, key);

    return this.cached[key] as T;
    // });
  }

  /** Trading strategy parameters */
  private readonly settings_lock = new Semaphore(1);
  private _settings: ParameterData | null = null;
  public async settings(): Promise<ParameterData> {
    if (this._settings !== null) return this._settings;
    return await this.settings_lock.use(async () => {
      if (this._settings !== null) return this._settings;
      const settings: ParameterData =
        (await this.assets.config.get("trading")) as ParameterData ||
        default_parameters;
      this._settings = settings;
      return settings;
    });
  }

  /** ID and value of account */
  private readonly account_lock = new Semaphore(1);
  private _account: Mirror | null = null;
  private async account(): Promise<Mirror> {
    if (this._account !== null) return this._account;
    return await this.account_lock.use(async () => {
      if (this._account !== null) return this._account;
      const account: Mirror = await this.assets.config.get("account") as Mirror;
      this._account = account;
      return account;
    });
  }

  /** Username of account */
  public async username(): Promise<string> {
    return (await this.account()).UserName;
  }

  /** Total value of account */
  public async value(): Promise<Amount> {
    const value: number = (await this.account()).Value;
    if (value == null) throw new Error("Account Value is null");
    return (await this.account()).Value;
  }

  /** First date of community data */
  private start(): Promise<DateFormat> {
    return this.cache<DateFormat>(
      "start",
      async () => (await this.assets.community.start()) as DateFormat,
    );
  }

  /** Last date of community data */
  private end(): Promise<DateFormat> {
    return this.cache<DateFormat>(
      "end",
      async () => (await this.assets.community.end()) as DateFormat,
    );
  }

  /** Which date of trading weekday is most recent to last date in repo */
  private readonly tradingDate_lock = new Semaphore(1);
  private _tradingDate: DateFormat | null = null;
  public async tradingDate(): Promise<DateFormat> {
    if (this._tradingDate !== null) return this._tradingDate;
    return await this.tradingDate_lock.use(async () => {
      if (this._tradingDate !== null) return this._tradingDate;
      console.log("Loading TradingDate");
      const repoEnd: DateFormat | null = await this.end();
      const weekday: number = (await this.settings()).weekday;
      const tradingDate: DateFormat = repoEnd
        ? dateFromWeekday(repoEnd, weekday)
        : NOW;
      this._tradingDate = tradingDate;
      return tradingDate;
    });
  }

  /** tradingDate as Bar */
  public async tradingBar(): Promise<Bar> {
    return dateToBar(await this.tradingDate());
  }

  /** Load list of names */
  private readonly names_lock = new Semaphore(1);
  private _names: Set<string> | null = null;
  private async names(): Promise<Set<string>> {
    if (this._names !== null) return this._names;
    return await this.names_lock.use(async () => {
      if (this._names !== null) return this._names;
      const names: Set<string> = await this.assets.community.allNames();
      this._names = names;
      return names;
    });
  }

  /** A semaphore for each investor */
  private readonly investorSemaphores = new Map<string, Semaphore>();
  private investor_semaphore(username: string): Semaphore {
    const lock = this.investorSemaphores.get(username);
    if (lock) return lock;
    const created = new Semaphore(1);
    this.investorSemaphores.set(username, created);
    return created;
  }

  /** Data for an investor */
  private readonly _investors = new Map<string, Investor>();
  private async investor(username: string): Promise<Investor> {
    const prev = this._investors.get(username);
    if (prev) return prev;

    const lock = this.investor_semaphore(username);
    return await lock.use(async () => {
      const investor: Investor = await this.assets.community.investor(username);
      this._investors.set(username, investor);
      return investor;
    });
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
  private readonly mirrors_lock = new Semaphore(1);
  private _mirrors: Mirrors | null = null;
  private async mirrors(): Promise<Mirrors> {
    // Mirrors already generated
    if (this._mirrors !== null) return this._mirrors;

    // Acquire lock
    return await this.mirrors_lock.use(async () => {
      // Confirm if resolved before lock acquired
      if (this._mirrors !== null) return this._mirrors;

      // Resolve mirrors
      const trading: DateFormat = await this.tradingDate();
      const journal: Journal = await this.mirrorJournal();
      const dates: Array<DateFormat> = journal.dates;
      const start: DateFormat = dates[0];
      const recent: DateFormat = dates.findLast((d) => d <= trading) || start;
      const mirrors: Mirrors = journal.before(recent);
      console.log("Mirrors loaded from date", recent, mirrors.length);
      this._mirrors = mirrors;
      return mirrors;
    });
  }

  /** Convert investor to instrument */
  public instrument(username: string): Promise<Instrument> {
    return this.cache<Instrument>(
      "instrument_" + username,
      async () => {
        const investor: Investor | null = await this.mirror(username);
        if (investor) {
          return new InvestorInstrument(investor);
        } else {
          // Create placeholder instrument
          const start: DateFormat = await this.start();
          const end: DateFormat = await this.end();
          const series: Buffer = new Float32Array(diffDate(start, end) + 1)
            .fill(
              10000,
            );
          const bar: Bar = diffDate(end, NOW);
          return new Instrument(series, bar, username, "Placeholder");
        }
      },
    );
  }

  /** Load instruments by list of investor names */
  private async instruments(names: Names): Promise<Instruments> {
    const instruments: Instruments = await Promise.all(
      Array.from(names).map((name: string) => this.instrument(name)),
    );
    return instruments;
  }

  /** Investors available on (upto EXTEND days before) trading date */
  public tradingInstruments(): Promise<Instruments> {
    return this.cache<Instruments>(
      "trading_instruments",
      async () => {
        const tradingDate: DateFormat = await this.tradingDate();
        const activeDate: DateFormat = nextDate(tradingDate, -EXTEND);
        const names: Names = await this.assets.community.active(activeDate);
        return this.instruments(names);
      },
    );
  }

  /** Load a number of random Instrument */
  public async instrumentSamples(count: number): Promise<Instruments> {
    const names: Names = await this.assets.community.samples(count);
    return this.instruments(names);
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

  /** Position for mirror */
  private positionid: PositionID = 0;
  private position(username: string, amount: Amount): Promise<Position> {
    return this.cache<Position>(
      "position_" + username,
      async () => {
        const instrument = await this.instrument(username);
        const startDate: DateFormat = await this.positionStart(username);
        // const tradingDate: DateFormat = await this.tradingDate();
        const startBar: Bar = diffDate(startDate, NOW);
        // const endBar: Bar = diffDate(tradingDate, NOW);
        const endBar: Bar = instrument.end;
        const startPrice: Price = instrument.price(startBar);
        const endPrice: Price = instrument.price(endBar);
        const startAmount: Amount = startPrice / endPrice * amount;
        const units: number = startAmount / startPrice;
        const position: Position = new Position(
          instrument,
          startAmount,
          startPrice,
          units,
          startBar,
          ++this.positionid,
        );
        return position;
      },
    );
  }

  /** All mirrors of account */
  private readonly positions_lock = new Semaphore(1);
  private _positions: Positions | null = null;
  private async positions(): Promise<Positions> {
    if (this._positions !== null) return this._positions;
    return await this.positions_lock.use(async () => {
      if (this._positions !== null) return this._positions;

      const mirrors: Mirrors = await this.mirrors();
      const scale: number = (await this.value()) / 100;
      const positions: Positions = await Promise.all(
        mirrors.map((m: Mirror) => this.position(m.UserName, m.Value * scale)),
      );
      this._positions = positions;
      return positions;
    });

    // return this.cache<Positions>(
    //   "positions",
    //   async () => {
    //     const mirrors: Mirrors = await this.mirrors();
    //     const scale: number = (await this.value()) / 100;
    //     const positions: Positions = await Promise.all(
    //       mirrors.map((m: Mirror) =>
    //         this.position(m.UserName, m.Value * scale)
    //       ),
    //     );
    //     return positions;
    //   },
    // );
  }

  /** Amount available for investing */
  private readonly amount_lock = new Semaphore(1);
  private _amount: Amount | null = null;
  private async amount(): Promise<Amount> {
    if (this._amount !== null) return this._amount;
    return await this.amount_lock.use(async () => {
      if (this._amount !== null) return this._amount;

      // return this.cache<Amount>(
      //   "amount",
      //   async () => {
      const bar: Bar = await this.tradingBar();
      const value: Amount = await this.value();
      const positions: Positions = await this.positions();
      const invested: Amount = sum(
        positions.map((p: Position) => p.value(bar + EXTEND)),
      );
      const amount: Amount = value - invested;
      this._amount = amount;
      return amount;
      //   },
      // );
    });
  }

  /** Investors available for purchase */
  private purchaseOrders(): Promise<PurchaseOrders> {
    return this.cache<PurchaseOrders>(
      "po",
      async () => {
        const instruments: Instruments = await this.tradingInstruments();
        const total: Amount = await this.amount();
        const amount: Amount = total / instruments.length;
        const purchaseOrders: PurchaseOrders = instruments.map(
          (instrument: Instrument) => ({ instrument, amount }),
        );
        return purchaseOrders;
      },
    );
  }

  /** Investors available for purchase */
  private closeOrders(): Promise<CloseOrders> {
    return this.cache<CloseOrders>(
      "co",
      async () => {
        const positions: Positions = await this.positions();
        const closeOrders: CloseOrders = positions.map(
          (position: Position) => ({ position, confidence: 1, reason: "Close"}),
        );
        return closeOrders;
      },
    );
  }

  /** Context for trading strategy */
  public async strategyContext(): Promise<StrategyContext> {
    const [bar, value, amount, purchaseorders, closeorders, positions] =
      await Promise.all(
        [
          this.tradingBar(),
          this.value(),
          this.amount(),
          this.purchaseOrders(),
          this.closeOrders(),
          this.positions(),
        ],
      ) as [Bar, Amount, Amount, PurchaseOrders, CloseOrders, Positions];
    return { bar, value, amount, purchaseorders, closeorders, positions };
  }

  /** Ranking model */
  public async rankingModel(): Promise<InvestorRanking> {
    const model: InvestorRanking = this.assets.ranking;
    const loaded: boolean = await model.load();
    if (!loaded) throw new Error("Ranking model not found");
    return model;
  }

  /** Timing Model */
  public timingModel(): Promise<Timing> {
    return this.assets.timing();
  }

  /** Target size of positions */
  public async positionSize(): Promise<Amount> {
    const settings: ParameterData = await this.settings();
    const size = settings.position_size;
    if (isNaN(size)) throw new Error("Position Size missing in settings");
    return size;
  }

  /** Trading Policy */
  public async strategy(): Promise<Strategy> {
    const settings: ParameterData = await this.settings();
    const ranking: InvestorRanking = await this.rankingModel();
    const timing: Timing = await this.timingModel();
    const ranker = makeRanker(ranking);
    const timer = makeTimer(timing);

    const policy = new Policy(ranker, timer, settings.position_size);
    const stoploss = new StopLossStrategy(settings.stoploss);
    const cascade = new CascadeStrategy([
      new WeekdayStrategy(settings.weekday),
      new FutureStrategy(180),
      policy,
      new RoundingStrategy(200),
    ]);
    const union  = new UnionStrategy([stoploss, cascade]);

    return union;
  }
}
