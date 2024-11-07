import type { Investors } from "📚/repository/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { today } from "📚/time/calendar.ts";

export type Position = {
  amount: number;
  investor: Investor;
};

export type Portfolio = Array<Position>;

/** Pick a random item from an array */
function any<T>(items: Array<T>): Array<T> {
  const count = items.length;
  if (count < 1) return [];
  const index = Math.floor(Math.random() * count);
  return [items[index]];
}

export class Strategy {
  public readonly investors?: Investors;
  public readonly amount?: number;
  public readonly date?: DateFormat;
  public readonly portfolio?: Portfolio;
  public parent?: Strategy;

  constructor(options: Partial<Strategy> = {}) {
    Object.assign(this, options);
  }

  /** Place another chain of strategies after this chain */
  public append(other: Strategy): Strategy {
    return other.prepend(this);
  }

  /** Place another chain of strategies before this chain */
  public prepend(other: Strategy): Strategy {
    if (this.parent) this.parent.prepend(other);
    else this.parent = other;
    return this;
  }

  private getAmount(): number {
    return this.amount || this.parent?.amount || 0;
  }

  private getDate(): DateFormat {
    return this.date || this.parent?.date || today();
  }

  /** Generate list of buy positions or pull from parent */
  protected getBuy(): Portfolio {
    if (this.investors) {
      // Create equal position in each investor
      const amount: number = this.getAmount() / this.investors.length;
      return this.investors.map((investor: Investor) => ({ amount, investor }));
    } else if (this.parent) return this.parent.buy();
    else return [];
  }

  public buy(): Portfolio {
    return this.getBuy();
  }

  /** Sel whole portfolio or parent portfolio */
  protected getSell(): Portfolio {
    return this.portfolio || this.parent?.portfolio || [];
  }

  public sell(): Portfolio {
    return this.getSell();
  }

  ////////////////////////////////////////////////////////////////////////
  // Amended strategies
  ////////////////////////////////////////////////////////////////////////

  /** Maybe buy or sell a position */
  public random(): Strategy {
    const amount = this.getAmount();
    return new Strategy({
      parent: this,
      buy: (): Portfolio =>
        Math.random() < 0.5
          ? any(this.getBuy()).map((p) => ({ amount, investor: p.investor }))
          : [],
      sell: (): Portfolio => Math.random() > 0.5 ? any(this.getSell()) : [],
    });
  }

  /** Buy nothing, sell all */
  public exit(): Strategy {
    return new Strategy({ parent: this, buy: (): Portfolio => [] });
  }

  /** Only buy active investors */
  public active(): Strategy {
    const date = this.getDate();
    return new Strategy({
      parent: this,
      buy: (): Portfolio =>
        this.getBuy().filter((p) => p.investor.active(date)),
    });
  }

  /** Sell all expired investors */
  public expired(): Strategy {
    const date = this.getDate();
    return new Strategy({
      parent: this,
      sell: (): Portfolio =>
        this.getSell().filter((p) => !p.investor.active(date)),
    });
  }
}

//////////////////////////////////////////////////////////////////////
/// Custom Strategies
//////////////////////////////////////////////////////////////////////

/** Pick first N positions from buy and sell portfolio */
export class LimitStrategy extends Strategy {
  constructor(private readonly count: number, data: Partial<Strategy> = {}) {
    super(data);
  }

  public override buy(): Portfolio {
    return this.getBuy().slice(0, this.count);
  }

  public override sell(): Portfolio {
    return this.getSell().slice(0, this.count);
  }
}
