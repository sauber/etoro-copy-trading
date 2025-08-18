import { Bar, Instrument } from "@sauber/backtest";
import { Signal } from "./signal.ts";

/** Generate and cache signal charts for each instrument */
export class CachedSignal extends Signal {
  private readonly charts = new Map<string, Instrument>();

  public override predict(instrument: Instrument, bar: Bar): number {
    // Attempt to use already cached signal chart
    const cached: Instrument | undefined = this.charts.get(instrument.symbol);
    if (cached) return cached.price(bar);

    // Generate signal chart and store in cache
    const chart: Instrument = this.generate(instrument);
    this.charts.set(instrument.symbol, chart);
    return chart.price(bar);
  }
}
