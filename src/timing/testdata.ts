export { investorId } from "📚/repository/testdata.ts";
export { repo } from "📚/repository/testdata.ts";
import { repo } from "📚/repository/testdata.ts";
import { Community } from "📚/repository/mod.ts";
import { Amount, Positions, PurchaseOrders, Strategy, StrategyContext } from "@sauber/backtest";

export const community = new Community(repo);

/** Buy nothing, sell nothing */
export class NullStrategy implements Strategy {
  public open(_context: StrategyContext): PurchaseOrders {
    return [];
  }

  public close(_context: StrategyContext): Positions {
    return [];
  }
}

/** Buy all, sell all */
export class PassThroughStrategy implements Strategy {
  public open(context: StrategyContext): PurchaseOrders {
    if ( context.instruments.length<1) return [];
    const amount: Amount = 1/context.instruments.length;
    return context.instruments.map(instrument=>({instrument, amount}));
  }

  public close(context: StrategyContext): Positions {
    return context.positions;
  }
}
