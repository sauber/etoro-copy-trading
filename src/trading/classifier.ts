import {
  Amount,
  Bar,
  CloseOrders,
  Instrument,
  PurchaseOrder,
  PurchaseOrders,
  StrategyContext,
} from "@sauber/backtest";
import { Candidate, CandidateExport } from "📚/trading/candidate.ts";

/** Rater function type to assess ranking or timing of instruments */
export type Rater = (instrument: Instrument, bar: Bar) => number;

type Rank = number;
type Timing = number;

/** Bundle purchaseorders and closeorders by instrument */
export class Classifier {
  /** List of candidates */
  private readonly candidates = new Map<string, Candidate>();

  constructor(
    private readonly context: StrategyContext,
    readonly ranking: Rater,
    readonly timing: Rater,
    readonly positionSize: number,
  ) {
    const target: Amount = context.value * positionSize;
    const bar = context.bar;

    // Organizer all purchaseorders by instrument
    context.purchaseorders.forEach((po) => {
      const instrument = po.instrument;
      const username: string = instrument.symbol;
      const candidate = new Candidate(
        instrument,
        bar,
        ranking(instrument, bar),
        timing(instrument, bar),
        target,
      );
      candidate.addPurchaseOrder(po);
      this.candidates.set(username, candidate);
    });

    // Add all open positions to candidates
    context.closeorders.forEach((co) => {
      const username: string = co.position.instrument.symbol;
      const candidate = this.candidates.get(username);
      if (candidate) candidate.addCloseOrder(co);
      else {
        const c = new Candidate(
          co.position.instrument,
          bar,
          ranking(co.position.instrument, bar),
          timing(co.position.instrument, bar),
          target,
        );
        c.addCloseOrder(co);
        this.candidates.set(username, c);
      }
    });
  }

  /** List of candidates */
  private get all(): Array<Candidate> {
    return Array.from(this.candidates.values());
  }

  /** List of candidate as exported records */
  public get records(): Array<CandidateExport> {
    return this.all.map((candidate: Candidate) => candidate.export());
  }

  /** The list of positions to open */
  public open(): PurchaseOrders {
    const candidates = this.all.filter((c: Candidate) => c.isBuy);
    // console.log("Count of Candidates with Purchase Orders:", candidates.length);
    return candidates.map((candidate: Candidate) => {
      const pos = candidate.purchaseorders;
      const po: PurchaseOrder = pos[0];
      // Change amount to gap
      const gap: number = candidate.gap;
      const changed: PurchaseOrder = Object.assign({}, po, { amount: gap });
      return changed;
    });
  }

  /** List of positions to close */
  public close(): CloseOrders {
    return this.all.filter((c: Candidate) => c.isSell).map((c: Candidate) =>
      c.closeorders
    ).flat();
  }
}
