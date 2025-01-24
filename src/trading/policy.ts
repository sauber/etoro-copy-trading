import {
  Bar,
  Buffer,
  Chart,
  CloseOrders,
  Instrument,
  PurchaseOrder,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { DataFrame } from "@sauber/dataframe";
import { Ranking } from "📚/ranking/mod.ts";
import { RSI } from "@debut/indicators";

export class Policy implements Strategy {
  constructor(
    private readonly ranking: Ranking,
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
      const source: Buffer = instrument.buffer;
      const rsi = new RSI(this.window);
      const series = source.map((v) => rsi.nextValue(v)).filter((v) =>
        v !== undefined && !isNaN(v)
      );
      this.charts[id] = new Chart(series, end);
    }
    return this.charts[id];
  }

  public open(context: StrategyContext): PurchaseOrders {
    const pos = context.purchaseorders;
    DataFrame.fromRecords(
      pos.map((po: PurchaseOrder) => ({
        UserName: po.instrument.symbol,
        Amount: po.amount,
        Instrument: po.instrument,
      })),
    )
      // .print("Investors")
      .amend(
        "Rank",
        (r) => this.ranking.predict(r.Instrument.investor, context.bar),
      )
      // .print("Ranks")
      .amend("RSI", (r) => this.chart(r.Instrument).bar(context.bar + 2))
      .amend("Score", (r) => r.Rank * r.RSI)
      .sort("Score").reverse
      .print("Score");
    return pos;
  }

  public close(context: StrategyContext): CloseOrders {
    const cos = context.closeorders;
    return cos;
  }
}
