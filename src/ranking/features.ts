import { barToDate, DateFormat } from "📚/time/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import type { StatsExport } from "📚/repository/mod.ts";
import { input_labels } from "📚/ranking/types.ts";
import type { Input, Output } from "📚/ranking/types.ts";
import { Bar, Series } from "@sauber/backtest";
import { score } from "📚/ranking/score.ts";

export class Features {
  constructor(private readonly investor: Investor) {}

  /** Prediction input parameters */
  public input(bar: Bar): Input {
    if (this.investor.stats.dates.length < 1) {
      throw new Error(`Investor ${this.investor.UserName} has no stats`);
    }
    const date: DateFormat = barToDate(bar);
    const values: StatsExport = ( date && this.investor.stats.start <= date )
      ? this.investor.stats.before(date)
      : this.investor.stats.first;

    return Object.fromEntries(
      input_labels.map((key: keyof StatsExport) => [key, Number(values[key])]),
    ) as Input;
  }

  /** Prediction output parameters */
  public output(bar: Bar): Output {
    const series: Series = this.investor.series;
    const end: Bar = this.investor.end;
    const start: Bar = series.length - (bar - end) + 1;
    const subchart: Series = series.slice(start);
    const sr: number = score(subchart);
    return sr;
  }
}
