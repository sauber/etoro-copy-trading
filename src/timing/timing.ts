import { Bar, Buffer, Chart, Instrument } from "@sauber/backtest";
import { RSI } from "@debut/indicators";
import { assert } from "@std/assert";

type ChartCache = Map<string, Chart>;

/** Asset buying or sell opportunity from instrument */
export class Timing {
  private readonly charts: ChartCache = new Map<string, Chart>();

  constructor(
    private readonly buy_window: number,
    private readonly buy_threshold: number,
    private readonly sell_window: number,
    private readonly sell_threshold: number,
  ) {
    assert(buy_window > 1, `buy_window out of range (1,): ${buy_window}`);
    assert(
      buy_threshold > 0 && buy_threshold <= 50,
      `buy_threshold out of range (1,50]: ${buy_window}`,
    );
    assert(sell_window > 1, `sell_window out of range (1,): ${buy_window}`);
    assert(
      sell_threshold >= 50 && sell_threshold < 100,
      `sell_threshold out of range [50,100): ${buy_window}`,
    );
  }

  /** Create chart with custom RSI window */
  private static create_chart(instrument: Instrument, window: number): Chart {
    const end: Bar = instrument.end;
    const source: Buffer = instrument.buffer;
    const rsi = new RSI(window);
    const series = source.map((v) => rsi.nextValue(v)).filter((v) =>
      v !== undefined && !isNaN(v)
    );
    return new Chart(series, end);
  }

  /** Get chart from cache, or create if missing */
  private cached_chart(
    instrument: Instrument,
    window: number,
  ): Chart {
    const id: string = instrument.symbol + ":" + window.toString();
    const cached: Chart | undefined = this.charts.get(id);
    if (cached) return cached;
    const created = Timing.create_chart(instrument, window);
    this.charts.set(id, created);
    return created;
  }

  /** Buying chart for instrument */
  private buy_chart(instrument: Instrument): Chart {
    return this.cached_chart(instrument, this.buy_window);
  }

  /** Buying chart for instrument */
  private sell_chart(instrument: Instrument): Chart {
    return this.cached_chart(instrument, this.sell_window);
  }

  /** Strength of buy signal on scale from 0 to 1 (1 is strongest) */
  private buy_signal(instrument: Instrument, bar: Bar): number {
    const chart: Chart = this.buy_chart(instrument);
    const effective: Bar = bar + 2;
    if (!chart.has(effective)) return 0;
    const value: number = chart.bar(effective);
    const signal: number = (this.buy_threshold - value) / this.buy_threshold;
    const result = Math.max(0, signal);
    return result;
  }

  /** Strength of sell signal on scale from -1 to 0 (-1 is strongest) */
  private sell_signal(instrument: Instrument, bar: Bar): number {
    const chart: Chart = this.sell_chart(instrument);
    const effective: Bar = bar + 2;
    if (!chart.has(effective)) return 0;
    const value: number = chart.bar(effective);
    const signal: number = (this.sell_threshold - value) /
      (100 - this.sell_threshold);
    const result = Math.min(0, signal);
    return result;
  }

  /** Range -1 to 0 is sell, range 0 to 1 is buy */
  public predict(instrument: Instrument, bar: Bar): number {
    const buy = this.buy_signal(instrument, bar);
    if (buy > 0) return buy;
    return this.sell_signal(instrument, bar);
  }
}
