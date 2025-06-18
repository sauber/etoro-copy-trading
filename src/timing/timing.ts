import { Bar, Buffer, Chart, Instrument } from "@sauber/backtest";
import { demark_signal } from "📚/timing/demark-signal.ts";

/** Asset buying or sell opportunity from instrument */
export class Timing {
  private readonly charts = new Map<string, Chart>();

  constructor(
    private readonly buy_window: number,
    private readonly buy_threshold: number,
    private readonly sell_window: number,
    private readonly sell_threshold: number,
  ) {
  }

  /** Create signal chart with custom parameters */
  private create_chart(instrument: Instrument): Chart {
    const signal: Buffer = demark_signal(
      instrument.buffer,
      this.buy_window,
      this.buy_threshold,
      this.sell_threshold,
    );
    const chart: Chart = new Chart(signal, instrument.end);
    return chart;
  }

  /** Get chart from cache, or create if missing */
  private cached_chart(
    instrument: Instrument,
  ): Chart {
    const id: string = instrument.symbol;
    const cached: Chart | undefined = this.charts.get(id);
    if (cached) return cached;
    const chart: Chart = this.create_chart(instrument);
    this.charts.set(id, chart);
    return chart;
  }

  public predict(instrument: Instrument, bar: Bar): number {
    const chart: Chart = this.cached_chart(instrument);
    const effective: Bar = bar + 2;
    if (!chart.has(effective)) return 0;
    const value: number = chart.bar(effective);
    return value;
  }
}
