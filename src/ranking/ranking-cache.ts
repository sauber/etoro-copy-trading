import { Investor } from "📚/investor/mod.ts";
// import { type DateFormat, Timeline } from "📚/tick/mod.ts";
import { Ranking } from "📚/ranking/mod.ts";
import { Tick } from "@sauber/backtest";

type Range = [Tick, Tick];
type Series = Float16Array;

/** Cache results from Ranking Model */
export class RankingCache implements Ranking {
  private readonly cache: Map<string, Series> = new Map();
  // private readonly ticker: Timeline;

  constructor(
    private readonly backend: Ranking,
    // private readonly start: DateFormat,
  ) {
    // this.ticker = new Timeline(this.start);
  }

  /**
   *        5
   * 10  8   4   2
   */

  /** Find first and last date refering to same stats, translate to ticks */
  private range(investor: Investor, tick: Tick): Range {
    // Dates are sorted from oldest to newest, and so are ticks
    // const ticks: Tick[] = investor.stats.dates.map((date: DateFormat) =>
    //   this.ticker.tick(date)
    // );
    const ticks = investor.stats.ticks;
    let range: Range = [tick, tick];
    for (const b of ticks) {
      if (b > tick) {
        range = [range[0], b];
        break;
      }
      if (b <= tick) range = [b, range[1]];
    }
    // console.log({ range, ticks, tick });
    // throw new Error("Debug: Check range calculation");
    return range;
  }

  /** Get series for investor */
  private series(investor: Investor): Series {
    const key: string = investor.UserName;
    const series: Series | undefined = this.cache.get(key);
    if (series) return series;

    // const created: Series = [];
    const start: Tick = investor.start;
    const end: Tick = investor.stats.end;
    const length: number = end - start + 1;
    const created: Series = new Float16Array(length);
    // console.log(
    //   `Create new ranking series length ${length} for ${investor.UserName} [${start};${end}]`,
    // );
    this.cache.set(key, created);
    return created;
  }

  /** Fill section of series with value */
  private fill(series: Series, value: number, range: Range): void {
    for (let i = range[0]; i <= range[1]; i++) {
      series[i] = value;
    }
  }

  /** Lookup value from series, or fill if missing */
  private value(investor: Investor, tick: Tick): number {
    const series: Series = this.series(investor);
    let index: number = tick - investor.start;
    if (index > (series.length - 1)) index = series.length - 1;
    if (series[index] === undefined || series[index] === 0) {
      const value = this.backend.predict(investor, tick);
      const range = this.range(investor, tick);
      // Shift range to offset of investor series
      const offset: Range = range.map((tick) => tick - investor.start) as Range;
      this.fill(series, value, offset);
      // console.log({
      //   range,
      //   offset,
      //   tick,
      //   value,
      //   length: series.length,
      //   index,
      //   lookup: series[index],
      // });
    }
    return series[index];
  }

  /** Predict value for investor at tick, using cache */
  public predict(investor: Investor, tick: Tick): number {
    const value = this.value(investor, tick);
    if (isNaN(value)) {
      // console.log(investor);
      throw new Error(
        `NaN ranking for ${investor.UserName} at tick ${tick} with range ${
          this.range(investor, tick)
        }`,
      );
    }
    return value;
  }
}
