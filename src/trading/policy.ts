import {
  Bar,
  Buffer,
  Chart,
  CloseOrder,
  CloseOrders,
  Instrument,
  PurchaseOrder,
  PurchaseOrders,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { DataFrame, RowRecord, RowRecords } from "@sauber/dataframe";
import { Ranking } from "📚/ranking/mod.ts";
import { RSI } from "@debut/indicators";
import { Investor } from "📚/investor/mod.ts";

export class Policy implements Strategy {
  public readonly window: number = 20;
  public readonly buy_threshold: number = 30;
  public readonly sell_threshold: number = 70;
  public readonly position_size: number = 0.05;

  constructor(
    private readonly ranking: Ranking,
    settings: Partial<Policy> = {},
  ) {
    Object.assign(this, settings);
  }

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

  /** Rank of investor at bar */
  private confidence(instrument: Instrument, bar: Bar): number | undefined {
    if ("investor" in instrument) {
      return this.ranking.predict(instrument["investor"] as Investor, bar);
    }
  }

  /** RSI value two bars ago */
  private timing(instrument: Instrument, bar: Bar): number {
    const rsi = this.chart(instrument).bar(bar + 2);
    return rsi;
  }

  /** Sort each positions into one of these categories:
   *
   * Sell Opportunity: Close now to take profit
   * Buy opportunity: Increase position if instrument is desired and under-invested
   * Keep
   */
  private close_classification(
    context: StrategyContext,
  ): [CloseOrders, CloseOrders, CloseOrders] {
    const close: CloseOrders = [];
    const increase: CloseOrders = [];
    const keep: CloseOrders = [];
    const targetAmount = context.value * this.position_size;

    for (const co of context.closeorders) {
      // Candidates for taking profit
      const timing = this.timing(co.position.instrument, context.bar);
      if (timing >= this.sell_threshold) {
        close.push(co);
        continue;
      }

      // Candidates to increase position size
      if (timing <= this.buy_threshold) {
        const gap = targetAmount - co.position.amount;
        if (gap > 0) {
          const confidence = this.confidence(
            co.position.instrument,
            context.bar,
          );
          if (confidence && confidence > 0) {
            increase.push(co);
            continue;
          }
        }
      }

      // Candidates to keep unchanged
      keep.push(co);
    }

    return [close, increase, keep];
  }

  /** Sort each instrument into one of these categories:
   * - Open: Open new position
   * - Increase: Increase size of existing position
   * - Pass: Instrument is not desired
   */
  private open_classification(
    context: StrategyContext,
  ): [PurchaseOrders, PurchaseOrders, PurchaseOrders] {
    const open: PurchaseOrders = [];
    const increase: PurchaseOrders = [];
    const pass: PurchaseOrders = [];
    const targetAmount = context.value * this.position_size;

    for (const po of context.purchaseorders) {
      const timing = this.timing(po.instrument, context.bar);
      const confidence = this.confidence(po.instrument, context.bar);

      // Desirable position
      if (timing <= this.buy_threshold && confidence && confidence > 0) {
        // TODO: Is it ok to compare instrument, or is it necessary to compare symbol instead?
        const existing = context.closeorders.find((co: CloseOrder) =>
          co.position.instrument === po.instrument
        );
        if (existing) {
          const gap = targetAmount - existing.position.amount;
          if (gap > 0) {
            increase.push(po);
            continue;
          }
        } else {
          open.push(po);
          continue;
        }
      }

      pass.push(po);
    }
    return [open, increase, pass];
  }

  /** List of open positions that should closed when the time is right */
  private open_keep(context: StrategyContext): CloseOrders {
    return context.closeorders.filter((co: CloseOrder) =>
      this.timing(co.position.instrument, context.bar) < this.sell_threshold
    )
      .filter((co: CloseOrder) => {
        this.confidence(co.position.instrument, context.bar) !== undefined;
      });
  }

  // Indentify positions that are
  // - Open, and want to close
  // - Open, and don't want to close (yet)
  // - Open, and want to increase
  // - New not yet open

  public open(context: StrategyContext): PurchaseOrders {
    // const investors = this.investors(context);
    // investors.print("Investors");

    const records: RowRecords = context.purchaseorders
      // Lookup Rank
      .map((po: PurchaseOrder) =>
        [po, this.rank(po.instrument, context.bar)] as [
          PurchaseOrder,
          number | undefined,
        ]
      )
      // Skip undefined or negative ranks
      .filter(([_, rank]) => rank !== undefined && rank > 0)
      // Lookup RSI
      .map(([po, rank]) =>
        [po, rank, this.chart(po.instrument).bar(context.bar + 2)] as [
          PurchaseOrder,
          number,
          number,
        ]
      )
      // Skip RSI above threshold
      .filter(([_po, _rank, rsi]) => rsi <= this.buy_threshold)
      // Compute Score as rank multiplied by strength of RSI signal
      .map(([po, rank, rsi]) =>
        [
          po,
          rank,
          rsi,
          rank * (this.buy_threshold - rsi) / this.buy_threshold,
        ] as [
          PurchaseOrder,
          number,
          number,
          number,
        ]
      )
      // Convert to records
      .map(([po, rank, rsi, score]) => ({
        UserName: po.instrument.symbol,
        PurchaseOrder: po,
        Target: po.amount * score,
        Rank: rank,
        RSI: rsi,
        Score: score,
      }));

    const df = DataFrame.fromRecords(records).sort("Score").reverse;
    df.print("Purchase Orders Bar " + context.bar);

    // Identify how much is already invested for each purchase target
    const cos: CloseOrders = context.closeorders;
    // console.log("Close Orders", cos);
    const targetAmount = context.value * this.position_size;
    const crec = cos
      // Current position size, target size and difference
      .map((co: CloseOrder) =>
        [
          co,
          co.position.amount,
          targetAmount,
          targetAmount - co.position.amount,
        ] as [CloseOrder, number, number, number]
      )
      // Only positive gaps
      .filter(([_co, _amount, _target, gap]) => gap > 0)
      // Convert to records
      .map(([co, amount, target, gap]) => ({
        UserName: co.position.instrument.symbol,
        CloseOrder: co,
        Invested: amount,
        Target: target,
        Gap: gap,
      } as RowRecord));

    // TODO:
    // - Only keep records that have posisitve gap
    // - Combine with the purchase orders
    // - Skip orders that are already decided to close
    // - Sort by gap

    const cdf = DataFrame.fromRecords(crec);
    cdf.digits(8).print(
      "Gaps of open positions " + context.bar + " Value " + context.value,
    );

    const combined = df.join(cdf, "UserName");
    combined.print("Combined");

    return df.values("PurchaseOrder") as PurchaseOrders;
  }

  public close(context: StrategyContext): CloseOrders {
    const cos = context.closeorders;
    return cos;
  }
}
