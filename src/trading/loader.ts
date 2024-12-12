import {
  Amount,
  Bar,
  Instrument,
  Instruments,
  Position,
  PositionID,
  Price,
} from "@sauber/backtest";
import { Positions, PurchaseOrders } from "@sauber/backtest";
import { type Parameters } from "📚/trading/trading-strategy.ts";
import { Assets } from "📚/assets/mod.ts";
import { DateFormat, dateFromWeekday, diffDate, today } from "📚/time/mod.ts";
import { Mirror, Names } from "📚/repository/mod.ts";
import { Diary, Investor } from "📚/investor/mod.ts";
import { sum } from "📚/math/statistics.ts";
import { InvestorInstrument } from "📚/trading/investor-instrument.ts";

const NOW: DateFormat = today();
type CacheValue =
  | Amount
  | Bar
  | DateFormat
  | Instrument
  | Instruments
  | Investor
  | Mirrors
  | Mirror
  | null
  | Parameters
  | Position
  | Positions
  | PurchaseOrders;
type Mirrors = Array<Mirror>;
type Journal = Diary<Mirrors>;

/** Load data to generate Strategy context */
export class Loader {
  constructor(private readonly assets: Assets) {}

  /** Load data from repo and cache */
  private readonly cached: Record<string, CacheValue> = {};
  private async cache<T>(
    key: string,
    loader: () => Promise<CacheValue>,
  ): Promise<T> {
    if (!(key in this.cache)) {
      const value: CacheValue = await loader();
      this.cached[key] = value;
    }
    return this.cached[key] as T;
  }

  /** Trading strategy parameters */
  public settings(): Promise<Parameters> {
    return this.cache<Parameters>(
      "settings",
      async () => (await this.assets.config.get("trading")) as Parameters,
    );
  }

  /** ID and value of account */
  private account(): Promise<Mirror> {
    return this.cache<Mirror>(
      "account",
      async () => (await this.assets.config.get("account")) as Mirror,
    );
  }

  /** Username of account */
  public async username(): Promise<string> {
    return (await this.account()).UserName;
  }

  /** Total value of account */
  public async value(): Promise<Amount> {
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
  public tradingDate(): Promise<DateFormat> {
    return this.cache<DateFormat>(
      "tradingDate",
      async () => {
        const repoEnd: DateFormat | null = await this.end();
        const weekday: number = (await this.settings()).weekday;
        return repoEnd ? dateFromWeekday(repoEnd, weekday) : NOW;
      },
    );
  }

  /** tradingDate as Bar */
  public tradingBar(): Promise<Bar> {
    return this.cache<Bar>(
      "tradingBar",
      async () => {
        const date: DateFormat = await this.tradingDate();
        const bar: Bar = diffDate(date, NOW);
        return bar;
      },
    );
  }

  /** Data for an investor */
  private investor(username: string): Promise<Investor> {
    return this.assets.community.investor(username);
  }

  /** Data for an investor or null if missing*/
  private mirror(username: string): Promise<Investor | null> {
    return this.cache<Investor | null>(
      "mirror_" + username,
      async () => {
        const names: Array<string> = await this.assets.community.allNames();
        return names.includes(username) ? await this.investor(username) : null;
      },
    );
  }

  /** Investor data for account */
  private async accountInvestor(): Promise<Investor> {
    const username: string = await this.username();
    const investor: Investor = await this.assets.community.investor(username);
    return investor;
  }

  /** Journal of mirrors of account */
  private async mirrorJournal(): Promise<Journal> {
    const investor: Investor = await this.accountInvestor();
    const mirrors: Journal = investor.mirrors;
    return mirrors;
  }

  /** List of mirrors most recent to trading date */
  private mirrors(): Promise<Mirrors> {
    return this.cache<Mirrors>(
      "mirrors",
      async () => {
        const trading: DateFormat = await this.tradingDate();
        const journal: Journal = await this.mirrorJournal();
        const dates: Array<DateFormat> = journal.dates;
        const start: DateFormat = dates[0];
        const recent: DateFormat = dates.findLast((d) => d < trading) || start;
        const mirrors: Mirrors = journal.before(recent);
        return mirrors;
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
          return new InvestorInstrument(investor);
        } else {
          // Create placeholder instrument
          const start: DateFormat = await this.start();
          const end: DateFormat = await this.end();
          const series: Array<Price> = Array(diffDate(start, end) + 1).fill(
            10000,
          );
          const bar: Bar = diffDate(end, NOW);
          return new Instrument(series, bar, username, "Placeholder");
        }
      },
    );
  }

  /** Investors available on trading date */
  private instruments(): Promise<Instruments> {
    return this.cache<Instruments>(
      "instruments",
      async () => {
        const date: DateFormat = await this.tradingDate();
        const names: Names = await this.assets.community.active(date);
        const instruments: Instruments = await Promise.all(
          names.map((name: string) => this.instrument(name)),
        );
        return instruments;
      },
    );
  }

  /** Start date of position.
   * If previous list of mirrors exists, and mirror is missing, then assume it was opened here.
   * Otherwise assume opened at beginning of all time.
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
        const tradingDate: DateFormat = await this.tradingDate();
        const startBar: Bar = diffDate(startDate, NOW);
        const endBar: Bar = diffDate(tradingDate, NOW);
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
  public positions(): Promise<Positions> {
    return this.cache<Positions>(
      "positions",
      async () => {
        const mirrors: Mirrors = await this.mirrors();
        const scale: number = (await this.value()) / 100;
        const positions: Positions = await Promise.all(
          mirrors.map((m: Mirror) =>
            this.position(m.UserName, m.Value * scale)
          ),
        );
        return positions;
      },
    );
  }

  /** Amount available for investing */
  public amount(): Promise<Amount> {
    return this.cache<Amount>(
      "amount",
      async () => {
        const bar: Bar = await this.tradingBar();
        const value: Amount = await this.value();
        const positions: Positions = await this.positions();
        const invested: Amount = sum(
          positions.map((p: Position) => p.value(bar)),
        );
        const amount: Amount = value - invested;
        return amount;
      },
    );
  }

  /** Assume all investors available for purchase */
  public purchaseOrders(): Promise<PurchaseOrders> {
    return this.cache<PurchaseOrders>(
      "po",
      async () => {
        const instruments: Instruments = await this.instruments();
        const total: Amount = await this.amount();
        const amount: Amount = total / instruments.length;
        const purchaseOrders: PurchaseOrders = instruments.map(
          (instrument: Instrument) => ({ instrument, amount }),
        );
        return purchaseOrders;
      },
    );
  }
}
