import { Bar, Series, Instrument } from "@sauber/backtest";
import { demark_signal } from "📚/timing/demark-signal.ts";
import { detrendExponential } from "./untrend.ts";

/** Asset buying or sell opportunity from instrument */
export class Timing {
  private readonly charts = new Map<string, Instrument>();

  constructor(
    private readonly buy_window: number,
    private readonly buy_threshold: number,
    private readonly sell_window: number,
    private readonly sell_threshold: number,
  ) {
  }

  /** Create signal chart with custom parameters */
  private create_chart(instrument: Instrument): Instrument {
    // XXX: This is too late to flatten, since simulation trades should use same flattened series
    const flattened: Series = detrendExponential(instrument.series);
    const signal: Series = demark_signal(
      flattened,
      this.buy_window,
      this.buy_threshold,
      this.sell_threshold,
    );
    const chart: Instrument = new Instrument(signal, instrument.end);
    return chart;
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

  public predict(instrument: Instrument, bar: Bar): number {
    const chart: Instrument = this.cached_chart(instrument);
    const effective: Bar = bar + 2;
    if (!chart.has(effective)) return 0;
    const value: number = chart.price(effective);
    return value;
  }
}
