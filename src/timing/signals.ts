import { Bar, Series, Instrument } from "@sauber/backtest";
import { Signal } from "./signal.ts";

/** Keep a cache of signal charts for instruments */
export class Signals {
  private readonly charts = new Map<string, Instrument>();

  constructor(
    private readonly indicator: Signal
  ) {}

  /** Create signal chart with custom parameters */
  private create_chart(instrument: Instrument): Instrument {
    const series: Series = this.indicator.get(instrument.series);
    return new Instrument(series, instrument.end, instrument.symbol, instrument.name + " Signal");
  }

  /** Get chart from cache, or create if missing */
  private cached_chart(
    instrument: Instrument,
  ): Instrument {
    const id: string = instrument.symbol;
    const cached: Instrument | undefined = this.charts.get(id);
    if (cached) return cached;
    const chart: Instrument = this.create_chart(instrument);
    this.charts.set(id, chart);
    return chart;
  }

  /** Signal strength for instrument at bar */
  public signal(instrument: Instrument, bar: Bar): number {
    const chart: Instrument = this.cached_chart(instrument);
    const effective: Bar = bar + 2;
    if (!chart.has(effective)) return 0;
    const value: number = chart.price(effective);
    return value;
  }
}
