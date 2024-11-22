import {
  Bar,
  Chart as InstrumentChart,
  Instrument as InstrumentInterface,
  Price,
} from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";
import { diffDate, today } from "📚/time/mod.ts";

export class Instrument implements InstrumentInterface {
  public readonly symbol: string;
  public readonly end: Bar;
  public readonly start: Bar;
  public readonly chart: InstrumentChart;

  constructor(investor: Investor) {
    this.symbol = investor.UserName;
    this.start = diffDate(investor.chart.start, today());
    this.end = diffDate(investor.chart.end, today());
    this.chart = new InstrumentChart(investor.chart.values, this.end);
  }

  public active(index: Bar): boolean {
    return index <= this.start && index >= this.end;
  }

  public price(index: Bar): Price {
    return this.chart.bar(index);
  }
}
