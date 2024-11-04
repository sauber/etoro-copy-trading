import type { Investors } from "📚/repository/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { Position } from "@sauber/trading-account";
import { InvestorInstrument } from "📚/simulation/investor-instrument.ts";

export type Positions = Array<Position>;

/** Pick a random item from an array */
function any<T>(items: Array<T>): Array<T> {
  const count = items.length;
  if (count < 1) return [];
  const index = Math.floor(Math.random() * count);
  return [items[index]];
}

export class Strategy {
  constructor(
    protected readonly investors: Investors,
    protected readonly parent?: Strategy,
  ) {}

  public buy(invested: Positions, date: DateFormat): Positions {
    return this.parent?.buy(invested, date) || [];
  }

  public sell(invested: Positions, date: DateFormat): Positions {
    return this.parent?.sell(invested, date) || [];
  }

  public get null(): NullStrategy {
    return new NullStrategy(this.investors, this);
  }

  public get exit(): ExitStrategy {
    return new ExitStrategy(this.investors, this);
  }

  public random(amount: number): RandomStrategy {
    return new RandomStrategy(this.investors, amount, this);
  }
}

//////////////////////////////////////////////////////////////////////
/// Strategies
//////////////////////////////////////////////////////////////////////

/** No change to orders */
export class NullStrategy extends Strategy {}

/** Always buy one random, never sell */
export class RandomStrategy extends Strategy {
  constructor(
    protected override readonly investors: Investors,
    private amount: number,
    protected override readonly parent?: Strategy,
  ) {
    super(investors, parent);
  }

  /** Generate 1 position of random investor */
  public override buy(invested: Positions, date: DateFormat): Positions {
    // Pick a random position from parent
    if (this.parent) return any(this.parent.buy(invested, date));

    // Pick a random investor and generate position
    const active = this.investors.filter((i) => i.active(date));
    if (active.length < 1) return [];
    const [investor] = any(active);
    const price = investor.chart.value(date);
    const units = this.amount / price;
    const position = new Position(
      new InvestorInstrument(investor),
      units,
      price,
    );
    return [position];
  }

  /** Generate 1 position of random investor */
  public override sell(invested: Positions, date: DateFormat): Positions {
    // Pick a random position from parent
    if (this.parent) return any(this.parent.sell(invested, date));

    // Pick random investment
    return any(invested);
  }
}

/** Sell all positions */
export class ExitStrategy extends Strategy {
  /** Buy nothing when exiting */
  public override buy(_invested: Positions, _date: DateFormat): Positions {
    return [];
  }

  /** Sell all */
  public override sell(invested: Positions, _date: DateFormat): Positions {
    return invested;
  }
}
