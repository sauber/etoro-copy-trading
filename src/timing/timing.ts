import { Bar, Instrument } from "@sauber/backtest";
import { Stochastic } from "./stochastic-signal.ts";

/** Asset buying or sell opportunity from instrument */
export class Timing {
  private readonly charts = new Map<string, Instrument>();

  constructor(
    private readonly smoothing: number,
    private readonly buy_threshold: number,
    private readonly sell_threshold: number,
  ) {}

  /** Create signal chart with custom parameters */
  private create_chart(instrument: Instrument): Instrument {
    const signal = new Stochastic(
      14, // TODO: Load from config
      this.smoothing,
      this.buy_threshold,
      this.sell_threshold,
    );
    const chart: Instrument = new Instrument(
      signal.get(instrument.series),
      instrument.end,
    );
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
