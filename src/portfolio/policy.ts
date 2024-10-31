import type { DateFormat } from "📚/time/mod.ts";
import type { Investors } from "📚/repository/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Chart } from "📚/chart/mod.ts";
import { DataFrame } from "@sauber/dataframe";
import type { RowRecord } from "@sauber/dataframe";
import { Portfolio } from "📚/portfolio/portfolio.ts";
import { Position } from "📚/portfolio/position.ts";
import { Order } from "📚/portfolio/order.ts";
import type { BuyItems, SellItems } from "📚/portfolio/order.ts";

type UserName = string;
type Score = number;
type UserScore = {
  UserName: string;
  Score: number;
};
export type Conviction = Record<UserName, Score>;
type Positions = Array<Position>;

export type IPolicy = {
  // Portfolio of current positions
  portfolio: Portfolio;

  // Historical performance of portfolio
  chart: Chart;

  // List of investors available on date
  investors: Investors;

  // Investors rank
  conviction: Record<UserName, Score>;

  // On which date to apply policy
  date: DateFormat;

  // Cash available for spending
  cash: number;

  // Target number of positions of in portfolio
  targets: number;
};

/** Convert dict of username=>number to dataframe */
function dataframe(c: Conviction): DataFrame {
  return DataFrame.fromDef(
    { UserName: "string", "Score": "number" },
    Object.entries(c).map(([k, v]) => ({ UserName: k, Score: v })),
  );
}

export class Policy {
  private readonly portfolio: Portfolio;
  private readonly chart: Chart;
  private readonly investors: Investors;
  private readonly conviction: DataFrame;
  private readonly date: DateFormat;
  private readonly cash: number;
  private readonly targets: number;

  constructor(params: IPolicy) {
    this.portfolio = params.portfolio;
    this.chart = params.chart;
    this.investors = params.investors;
    this.conviction = dataframe(params.conviction);
    this.date = params.date;
    this.cash = params.cash;
    this.targets = params.targets;
  }

  /** Sum of cash and value of positions */
  // TODO: Cannot calculate value of expired positions
  private get value(): number {
    return this.cash + this.portfolio.value(this.date);
  }

  /** Identify expired positions from portfolio */
  private get expired(): Order {
    return new Order().sell(
      this.portfolio.positions.filter((position: Position) =>
        position.expired(this.date)
      ).map((position: Position) => ({
        position,
        reason: "expired",
      })),
    );
  }

  /** Identify positions which boxed hit limits from portfolio */
  private get limited(): Order {
    return new Order().sell(
      this.portfolio.positions
        .filter((position: Position) => position.limited(this.date))
        .map((position: Position) => ({ position, reason: "limit" })),
    );
  }

  /** Positions that are neither expired nor hit limits */
  private get open(): Order {
    return new Order().sell(
      this.portfolio.positions
        .filter((position: Position) => position.open(this.date))
        .map((position: Position) => ({ position, reason: "open" })),
    );
  }

  /** Lookup investor object by UserName */
  private investor(UserName: string): Investor {
    return this.investors.find((i) => i.UserName === UserName) as Investor;
  }

  /** Given investor ranks, available cash etc.
   * what is ideal target investment level for each investor
   */
  private get target(): DataFrame {
    return this.conviction
      .select((r) => r.Score as Score > 0).sort("Score")
      .reverse
      .slice(0, this.targets)
      .add("Score", 2)
      .log("Score")
      .distribute("Score")
      .scale("Score", this.value)
      .rename({ "Score": "Amount" });
  }

  /** Which positions in portfolio are no longer among targets */
  private get unranked(): Positions {
    const targetNames = this.target.values("UserName") as UserName[];
    const remove: Positions = this.portfolio.positions
      .filter((p) => !targetNames.includes(p.name));
    return remove;
  }

  /** Gap =
   * Open positions no longer desired
   * Desired positions not in portfolio, or by less amount than desired
   */
  // public get gap(): DataFrame {
  //   const targets: DataFrame = this.target;
  //   const portfolio: Order = this.open;
  //   console.log({ targets, portfolio });

  //   // Target amount for each UserName
  //   const targetAmount: Record<string, number> = Object.fromEntries(
  //     targets.records.map((r: RowRecord) => [r.UserName, r.Rank]),
  //   );

  //   // Current amount for each UserName
  //   // TODO: If multiple positions by same name, add values
  //   const currentAmount: Record<string, number> = Object.fromEntries(
  //     portfolio.sellItems.map((
  //       p: SellItem,
  //     ) => [p.position.name, p.position.value(this.date)]),
  //   );

  //   // Positions no longer a target
  //   const excessive: Record<string, number> = Object.fromEntries(
  //     Object.entries(currentAmount).filter(([UserName, _value]) =>
  //       !(UserName in targetAmount)
  //     ),
  //   );

  //   console.log({ targetAmount, currentAmount, excessive });

  // Targets missing from positions
  //const missing = targets.records.filter((target: RowRecord) => ! (target.UserName in positionSizes));

  // // Targets larger than positions
  // const tooSmall = targets.records.filter((target: RowRecord) => ( target.UserName in positionSizes ) && (target.Rank > positionSizes[target.UserName]));

  // return new DataFrame();
  // }

  /** Run through steps of policy. Compile a list of buy and sell orders. */
  // public run(): Order {
  //   const compiled = new Order();
  //   // Positions considered gone
  //   compiled.sell(this.expired.sellItems);
  //   compiled.sell(this.limited.sellItems);
  //   // Remaining open positions
  //   const open: Order = this.open;
  //   // Ideal portfolio based on current ranking
  //   const target: DataFrame = this.target;

  //   // Desired = ideal - open
  //   const gap = this.gap;
  //   // timing
  //   // close undesired
  //   // close desired, if necessary
  //   // buy desired as necessary
  //   // Resolve positions that are both sell and buy at the same time
  //   return compiled;
  // }

  /** Amount invested for each investor */
  private get invested(): Conviction {
    const sell: SellItems = this.open.sellItems;
    const inv: Conviction = {};
    sell.forEach((pos) => {
      const user = pos.position.name;
      const amount = pos.position.amount;
      inv[user] = user in inv ? inv[user] + amount : amount;
    });
    return inv;
  }

  /** Target size minus current size */
  private get buyGap(): DataFrame {
    const target: DataFrame = this.target;
    const invested: Conviction = this.invested;
    const gap: DataFrame = target
      .rename({ Amount: "Target" })
      .amend("Invested", (r: RowRecord) => invested[r.UserName as string])
      .amend(
        "Buy",
        (r) =>
          Number.isFinite(r.Invested)
            ? (r.Target as number) - (r.Invested as number)
            : (r.Target as number),
      );
    return gap;
  }

  /** Sell every that is unranked
   * TODO: Only sell if potential for growth is lost
   */
  private get sellGap(): DataFrame {
    const records = this.unranked.map((p) => ({ Position: p, Reason: "Rank" }));
    return DataFrame.fromDef({ Position: "object", Reason: "string" }, records);
  }

  /** List of investments to open or increase */
  public get buy(): BuyItems {
    const frame: DataFrame = this.buyGap;

    return frame.records.map((r) => ({
      investor: this.investor(r.UserName as UserName),
      date: this.date,
      amount: r.Buy as number,
    }));
  }

  /** List of investments to close */
  public get sell(): SellItems {
    const frame: DataFrame = this.sellGap;

    return frame.records.map((r) => ({
      position: r.Position as Position,
      reason: r.Reason as string,
    }));
  }
}
