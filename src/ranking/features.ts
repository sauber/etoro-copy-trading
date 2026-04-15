import { type DateFormat, Timeline } from "📚/tick/mod.ts";
import { Series, Tick } from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";
import type { StatsExport } from "📚/repository/mod.ts";
import { input_labels } from "📚/ranking/types.ts";
import type { Input, Output } from "📚/ranking/types.ts";
import { score } from "📚/ranking/score.ts";

/** Extract features for Investor at Bar */
export class Features {
  constructor(
    private readonly investor: Investor,
    private readonly ticker: Timeline,
  ) {}

  /** Prediction input parameters */
  public input(tick: Tick): Input {
    if (this.investor.stats.dates.length < 1) {
      throw new Error(`Investor ${this.investor.UserName} has no stats`);
    }
    const date: DateFormat = this.ticker.date(tick);
    const values: StatsExport = (date && this.investor.stats.start <= date)
      ? this.investor.stats.before(date)
      : this.investor.stats.first;

    return Object.fromEntries(
      input_labels.map((key: keyof StatsExport) => [key, Number(values[key])]),
    ) as Input;
  }

  /** Prediction output parameters */
  public output(tick: Tick): Output {
    const series: Series = this.investor.series;
    const start: Tick = tick - this.investor.start;
    const subchart: Series = series.slice(start);
    const sr: number = score(subchart);
    return sr;
  }
}
