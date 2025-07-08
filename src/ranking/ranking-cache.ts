import { InvestorRanking } from "./investor-ranking.ts";
import { Investor } from "📚/investor/mod.ts";
import { Bar } from "@sauber/backtest";
import { type DateFormat, dateToBar } from "@sauber/dates";
import { Ranking } from "📚/ranking/mod.ts";

type Range = [Bar, Bar];
type Series = Array<number>;

/** Cache results from Ranking Model */
export class RankingCache implements Ranking {
  private readonly cache: Map<string, Array<number>> = new Map();

  constructor(private readonly backend: InvestorRanking) {}

  /**
   *        5
   * 10  8   4   2
   */

  /** Find first and last date refering to same stats */
  private range(investor: Investor, bar: Bar): Range {
    // Dates are sorted from oldest to newest, and so are bars
    const bars: Bar[] = investor.stats.dates.map((date: DateFormat) =>
      dateToBar(date)
    );
    // console.log({ bars });
    let range: Range = [bar, bar];
    for (const b of bars) {
      if (b < bar) {
        range = [range[0], b];
        break;
      }
      if (b >= bar) range = [b, range[1]];

      // console.log([bar, b, range]);
    }
    // console.log(bar, range);
    return range;
  }

  /** Get series for investor */
  private series(investor: Investor): Series {
    const key: string = investor.UserName;
    const series: Series | undefined = this.cache.get(key);
    if (series) return series;

    const created: Series = [];
    this.cache.set(key, created);
    return created;
  }

  /** Fill section of series with value */
  private fill(series: Series, value: number, range: Range): void {
    for (let i = range[0]; i >= range[1]; i--) {
      // console.log("Fill index", i, "value", value);
      series[i] = value;
    }
  }

  /** Lookup value from series, or fill if missing */
  private value(investor: Investor, bar: Bar): number {
    const series: Series = this.series(investor);
    if (series[bar] === undefined) {
      const value = this.backend.predict(investor, bar);
      const range = this.range(investor, bar);
      this.fill(series, value, range);
    }
    return series[bar];
  }

  public predict(investor: Investor, bar: Bar): number {
    return this.value(investor, bar);
  }
}
