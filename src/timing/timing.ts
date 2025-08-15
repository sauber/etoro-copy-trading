import { Bar, Instrument } from "@sauber/backtest";
import { Stochastic as Signal, Parameters as SignalParameters } from "./stochastic-signal.ts";

/** Asset buying or sell opportunity from instrument */
export class Timing {
  // Cache of signal charts already created
  private readonly charts = new Map<string, Instrument>();

  // Creator of signals from value charts
  private readonly signal: Signal;

  constructor(parameters: SignalParameters) {
    this.signal = new Signal(parameters);
  }

  /** Create signal chart with custom parameters */
  private create_chart(instrument: Instrument): Instrument {
    const chart: Instrument = new Instrument(
      this.signal.get(instrument.series),
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
