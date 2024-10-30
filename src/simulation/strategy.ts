import type { Investors } from "📚/repository/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import type { DateFormat } from "../time/mod.ts";
import { Order } from "../portfolio/order.ts";
import { Portfolio } from "../portfolio/portfolio.ts";
//import { Ranking } from "📚/ranking/ranking.ts";

/** Pick a random item from an array */
function any<T>(items: Array<T>): T {
  const count = items.length;
  const index = Math.floor(Math.random() * count);
  return items[index];
}

export class Strategy {
  constructor(
    protected readonly investors: Investors,
    protected readonly parent?: Strategy,
  ) {}

  /** List of buy and sell orders */
  public order(
    portfolio: Portfolio,
    date: DateFormat,
    order: Order = new Order(),
  ): Order {
    return this.parent?.order(portfolio, date, order) || order;
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

  public override order(
    portfolio: Portfolio,
    date: DateFormat,
    order: Order = new Order(),
  ): Order {
    order = this.parent?.order(portfolio, date, order) || order;
    if (this.investors.length > 0) {
      const investor: Investor = any(this.investors);
      const amount = this.amount;
      order.buy([{ investor, amount, date }]);
    }
    return order;
  }
}

/** Sell all positions */
export class ExitStrategy extends Strategy {
  public override order(
    portfolio: Portfolio,
    date: string,
    order: Order = new Order(),
  ): Order {
    order = this.parent?.order(portfolio, date, order) || order;
    order.sell(
      portfolio.positions.map((position) => ({ position, reason: "exit" })),
    );
    return order;
  }
}

/** Rank all investors by conviction */
// export class ConvictionStrategy extends Strategy {
//   public order(portfolio: Portfolio, date: string, order: Order = new Order): Order {
//     order = this.parent?.order(portfolio, date, order) || order;
//     const ranking = new Ranking(this.repo);
//     const investors = this.community.on(date);
//     const prediction = ranking.predict(investors, date);
//   }
// }
