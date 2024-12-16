import {
  Amount,
  Bar,
  CloseOrders,
  Instrument,
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

  public close(context: StrategyContext): CloseOrders {
    const bar: Bar = context.bar;
    return context.closeorders.filter((closeorder) => {
      const rsiChart = this.chart(closeorder.position.instrument as Instrument);
      // console.log("Close RSI", position.instrument.symbol, bar, rsiChart.bar(bar));
      if (!rsiChart.has(bar)) return false;
      if (rsiChart.bar(bar) < this.sell_threshold) return false;
      return true;
    });
  }

  public open(context: StrategyContext): PurchaseOrders {
    const bar: Bar = context.bar;
    const threshold: number = this.buy_threshold;
    const purchaseOrders: PurchaseOrders = context.purchaseorders
      // Add chart
      .map((po: PurchaseOrder) =>
        [po, this.chart(po.instrument)] as [PurchaseOrder, Chart]
      )
      // Confirm chart data avilable
      .filter(([_po, chart]) => chart.has(bar))
      // Add chart value
      .map(([po, chart]) => [po, chart.bar(bar)] as [PurchaseOrder, Price])
      // Confirm chart value below opening threshold
      .filter(([_po, rsi]) => rsi <= threshold)
      // Calculate amount
      .map(([po, rsi]) => {
        const instrument: Instrument = po.instrument;
        const amount: Amount = po.amount * (threshold - rsi) / threshold;
        return { instrument, amount };
      });
    return purchaseOrders;
  }
}
