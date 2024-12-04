import {
  Amount,
  Bar,
  Instrument,
  Instruments,
  Positions,
  Price,
  PurchaseOrders,
  Series,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { RSI } from "@debut/indicators";

/** Lookup Series by Bar */
class Chart {
  constructor(private readonly series: Series, private readonly end: Bar) {}
  public has(bar: Bar): boolean {
    return bar >= this.end && bar <= this.end + this.series.length;
  }
  public bar(bar: Bar): Price {
    return this.series[bar - this.end];
  }
}

export class TimingStrategy implements Strategy {
  // Weekday of today
  private readonly today = new Date().getDay();

  constructor(
    private readonly window: number = 20,
    private readonly buy_threshold: number = 30,
    private readonly sell_threshold: number = 70,
    private readonly weekday: number = 0,
  ) {}

  // Generate RSI chart for instrument
  private readonly charts: Record<string, Chart> = {};
  private chart(instrument: Instrument): Chart {
    const id = instrument.symbol;
    if (!this.charts[id]) {
      const end: Bar = instrument.end;
      const source: Series = instrument.series;
      const rsi = new RSI(this.window);
      const series = source.map((v) => rsi.nextValue(v)).filter((v) =>
        v !== undefined
      );
      this.charts[id] = new Chart(series, end);
    }
    return this.charts[id];
  }

  public open(context: StrategyContext): PurchaseOrders {
    // Available funds
    if (context.amount < 100) return [];

    // Is today a trading day
    const bar: Bar = context.bar;
    if (this.today - context.bar % 7 !== 0) return [];

    // Identify all instruments where RSI is below buy_threshold
    const toBuy: Instruments = context.instruments.filter((instrument) => {
      const rsiChart = this.chart(instrument as Instrument);
      if (!rsiChart.has(bar)) return false;
      if (rsiChart.bar(bar) > this.buy_threshold) return false;
      return true;
    });
    // Distribute amount across all application instruments
    const amount: Amount = context.amount / toBuy.length / 2;
    if (amount < 100) return [];

    return toBuy.map((instrument) => ({ instrument, amount }));
  }

  public close(context: StrategyContext): Positions {
    // Is today a trading day
    const bar: Bar = context.bar;
    if (this.today - bar % 7 !== 0) return [];

    // Identify all instruments where RSI is over sell_threshold
    const toSell: Positions = context.positions.filter((position) => {
      const rsiChart = this.chart(position.instrument as Instrument);
      if (!rsiChart.has(bar)) return false;
      if (rsiChart.bar(bar) < this.sell_threshold) return false;
      return true;
    });

    return toSell;
  }
}
