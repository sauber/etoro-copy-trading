import {
  Bar,
  Instrument,
  Positions,
  Price,
  PurchaseOrder,
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
    return bar >= this.end && bar <= this.end + this.series.length &&
      this.series.length > 0;
  }
  public bar(bar: Bar): Price {
    return this.series[bar - this.end];
  }
}

export class RSIStrategy implements Strategy {
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
        v !== undefined && !isNaN(v)
      );
      this.charts[id] = new Chart(series, end);
    }
    return this.charts[id];
  }

  public close(context: StrategyContext): Positions {
    const bar: Bar = context.bar + 2; // Charts delayed two days
    return context.positions.filter((position) => {
      const rsiChart = this.chart(position.instrument as Instrument);
      // console.log("Close RSI", position.instrument.symbol, bar, rsiChart.bar(bar));
      if (!rsiChart.has(bar)) return false;
      if (rsiChart.bar(bar) > this.sell_threshold) return false;
      return true;
    });
  }

  public open(context: StrategyContext): PurchaseOrders {
    const bar: Bar = context.bar + 2; // Charts delayed two days
    const threshold: number = this.buy_threshold;
    return context.instruments
      .map((instrument) => {
        const rsiChart = this.chart(instrument as Instrument);
        if (!rsiChart.has(bar)) return { instrument, amount: 0 };
        const rsi = rsiChart.bar(bar);
        return { instrument, amount: (threshold - rsi) / threshold };
      })
      .filter((po: PurchaseOrder) => po.amount > 0);
  }
}
