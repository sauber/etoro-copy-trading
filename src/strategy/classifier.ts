import {
  Amount,
  CloseOrders,
  Position,
  PurchaseOrder,
  PurchaseOrders,
  StrategyContext,
} from "@sauber/backtest";
import { assert } from "@std/assert";
import { Candidate, CandidateExport } from "./candidate.ts";
import { Rater } from "./strategy.ts";

/** Bundle purchaseorders and closeorders together by instrument */
export class Classifier {
  /** List of candidates */
  private readonly candidates = new Map<string, Candidate>();

  constructor(
    private readonly context: StrategyContext,
    readonly ranking: Rater,
    readonly timing: Rater,
    readonly positionSize: number,
  ) {
    assert(
      positionSize > 0 && positionSize <= 1,
      `positionSize out of range (0,1]: ${positionSize}`,
    );
    const target: Amount = context.value * positionSize;
    const bar = context.bar;

    // Group all purchaseorders by instrument
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
      // TODO: bundle positions into multipositions first, instead of drip feeding into a candidate
      candidate.addPurchaseOrder(po);
      this.candidates.set(username, candidate);
    });

    // Add all open positions to candidates
    context.positions.forEach((position) => {
      const username: string = position.instrument.symbol;
      const candidate = this.candidates.get(username);
      if (candidate) candidate.addPosition(position);
      else {
        const c = new Candidate(
          position.instrument,
          bar,
          ranking(position.instrument, bar),
          timing(position.instrument, bar),
          target,
        );
        c.addPosition(position);
        this.candidates.set(username, c);
      }
    });
  }

  /** List of candidates */
  private get all(): Array<Candidate> {
    return Array.from(this.candidates.values());
  }

  /** List of candidates as exported records */
  public get records(): Array<CandidateExport> {
    return this.all.map((candidate: Candidate) => candidate.export());
  }

  /** The list of positions to open */
  public open(): PurchaseOrders {
    // List of candidates marked as buying opportunity
    const candidates = this.all.filter((c: Candidate) => c.isBuy);

    // Calculate amount for each candidate
    return candidates.map((candidate: Candidate) => {
      const pos = candidate.purchaseorders;
      const po: PurchaseOrder = pos[0];
      const amount: Amount = candidate.BuyAmount;
      const changed: PurchaseOrder = Object.assign({}, po, { amount });
      return changed;
    });
  }

  /** List of positions to close */
  public close(): CloseOrders {
    return this.all
      .filter((c: Candidate) => c.isSell)
      .map((c: Candidate) => c.positions)
      .flat()
      .map((position: Position) => ({
        position,
        confidence: 1,
        reason: "Close",
      }));
  }
}
