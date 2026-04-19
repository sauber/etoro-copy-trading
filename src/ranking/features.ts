import { Series, Tick } from "@sauber/backtest";

import { Investor } from "📚/investor/mod.ts";
import type { StatsExport } from "📚/repository/mod.ts";

import { input_labels } from "./types.ts";
import type { Input, Output } from "./types.ts";
import { score } from "./score.ts";

/** Extract features for Investor at Bar */
export class Features {
  constructor(
    private readonly investor: Investor,
    // private readonly ticker: Timeline,
  ) {}

  /** Prediction input parameters */
  public input(tick: Tick): Input {
    if (this.investor.stats.ticks.length < 1) {
      throw new Error(`Investor ${this.investor.UserName} has no stats`);
    }
    const values: StatsExport = (this.investor.stats.start <= tick)
      ? this.investor.stats.before(tick)
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
