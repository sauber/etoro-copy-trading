import { DateFormat } from "📚/time/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import type { StatsExport } from "📚/repository/mod.ts";
import { input_labels } from "📚/ranking/types.ts";
import type { Input, Output } from "📚/ranking/types.ts";
import { Bar, Buffer } from "@sauber/backtest";
import { sharpe_ratio } from "📚/math/sharperatio.ts";

export class Features {
  constructor(private readonly investor: Investor) {}

  /** Prediction input parameters */
  public input(date?: DateFormat): Input {
    if (this.investor.stats.dates.length < 1) {
      throw new Error(`Investor ${this.investor.UserName} has no stats`);
    }
    const values: StatsExport = date
      ? this.investor.stats.before(date)
      : this.investor.stats.first;

    return Object.fromEntries(
      input_labels.map((key: keyof StatsExport) => [key, Number(values[key])]),
    ) as Input;
  }

  /*
        start .. bar .. end  length
    bar:  200 .. 192 .. 190      11
    index:  0 ..   8 ..  10      11
    sub     0        ..   2       3
*/
  /** Prediction output parameters */
  public output(bar: Bar): Output {
    const buffer = this.investor.chart.values;
    const end = this.investor.chart.end;
    // const chart: Chart = this.investor.chart.from(start);
    const start: number = buffer.length - (bar - end) + 1;
    const subchart: Buffer = buffer.slice(start);
    console.log(buffer.length, subchart.length);
    // if (this.investor.UserName === "bendri00") {
    //   console.log(chart);
    //   Deno.exit(143);
    // }
    // 5% is annual money market return.
    // TODO: Load from config
    const sr: number = sharpe_ratio(subchart);
    // if (!Number.isFinite(sr)) {
    //   const name = this.investor.UserName;
    //   console.log({ chart, name, start, sr });
    //   throw new Error("Invalid SharpeRatio");
    // }
    return { SharpeRatio: sr };
  }
}
