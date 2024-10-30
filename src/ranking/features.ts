import { DateFormat } from "📚/time/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import type { StatsExport } from "📚/repository/mod.ts";
import { Chart } from "📚/chart/mod.ts";
import { input_labels } from "📚/ranking/types.ts";
import type { Input, Output } from "📚/ranking/types.ts";

export class Features {
  constructor(private readonly investor: Investor) {}

  /** Prediction input parameters */
  public input(date?: DateFormat): Input {
    if ( this.investor.stats.dates.length < 1 ) throw new Error(`Investor ${this.investor.UserName} has no stats`);
    const values: StatsExport = date
      ? this.investor.stats.before(date)
      : this.investor.stats.first;

    return Object.fromEntries(
      input_labels.map((key: keyof StatsExport) => [key, Number(values[key])]),
    ) as Input;
  }

  /** Prediction output parameters */
  public output(start: DateFormat = this.investor.stats.start): Output {
    const chart: Chart = this.investor.chart.from(start);
    // 5% is annual money market return.
    // TODO: Load from config
    const sr: number = chart.sharpeRatio(0.0);
    if (!Number.isFinite(sr)) {
      const name = this.investor.UserName;
      console.log({ chart, name, start, sr });
      throw new Error("Invalid SharpeRatio");
    }
    return { SharpeRatio: sr };
  }
}
