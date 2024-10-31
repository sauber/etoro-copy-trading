import { DateFormat, nextDate } from "📚/time/mod.ts";
import { Chart } from "📚/chart/mod.ts";
import type { Investors } from "📚/repository/mod.ts";
import { Order, Portfolio, Position } from "📚/portfolio/mod.ts";
import type { Positions } from "📚/portfolio/mod.ts";
import { Strategy } from "./strategy.ts";
import { Exchange } from "./exchange.ts";
import { Book } from "./book.ts";
import { DataFrame } from "@sauber/dataframe";

type Name = Array<string>;

/** Simulate trading over a period */
export class Simulation {
  private readonly exchange: Exchange;
  public readonly book: Book;
  private readonly portfolio: Portfolio;

  constructor(
    private readonly start: DateFormat,
    private readonly end: DateFormat,
    private readonly investors: Investors,
    private readonly strategy: Strategy,
    private cash: number = 100000,
  ) {
    this.exchange = new Exchange();
    this.book = new Book();
    this.book.deposit(start, cash);
    this.portfolio = this.book.portfolio;
  }

  // /** Generate a strategy for the current date and current portfolio */
  // private async StrategyInstance(date: DateFormat): Promise<Strategy> {
  //   const Class = this.strategy;
  //   const objects: Array<Investor> = await this.community.on(date);
  //   const investors: Investors = new ObjectSeries(objects);
  //   const strategy: Strategy = new Strategy(investors);
  //   return strategy;
  // }

  /** Identify which investors are active on any given day */
  private on(date: DateFormat): Investors {
    return this.investors.filter((i) =>
      i.chart.start >= date && i.chart.end <= date
    );
  }

  /** Open all positions suggested by strategy */
  private open(date: DateFormat): void {
    const order: Order = this.strategy.order(this.portfolio, date);
    const open = order.buyItems;
    for (const order of open) {
      // const name: string = order.name;
      // const investor: Investor = await this.community.investor(name);
      const position: Position = this.exchange.buy(
        order.investor,
        date,
        order.amount,
      );
      this.book.add(date, position);
    }
  }

  /** Close all positions suggested by strategy */
  private close(date: DateFormat): void {
    const order: Order = this.strategy.order(this.portfolio, date);
    const close = order.sellItems;

    // TODO!!
    // Identify all matching positions
    // const positions: Array<Position> = []
    // for ( const order of close ) {
    //   positions = this.book.match(order.investor);
    // }

    // Close all matching positions
    // for (const position of close) {
    //   const refund: number = this.exchange.sell(position, date);
    //   this.book.remove(date, position, "sell", refund);
    // }
  }

  /** Close any positions with expired underlying data */
  private expire(date: DateFormat): void {
    const expired: Positions = this.portfolio.positions.filter((p) =>
      p.expired(date)
    );
    const yesterday: DateFormat = nextDate(date, -1);
    for (const position of expired) {
      const selling_price: number = this.exchange.sell(position, yesterday);
      //console.log('book.remove', date, position, selling_price);
      //throw new Error('Simulation Expire');
      this.book.remove(date, position, "expire", selling_price);
    }
  }

  /** Calculate value of portfolio */
  private valuate(date: DateFormat): void {
    this.book.valuate(date);
  }

  /** Run a trading session on a particlar date */
  private step(date: DateFormat): void {
    this.expire(date);
    this.valuate(date);
    this.close(date);
    this.open(date);
  }

  /** Run a trading sesssion each day in period */
  public run(): void {
    let date = this.start;
    while (date <= this.end) {
      //console.log(date);
      this.step(date);
      date = nextDate(date);
    }
  }

  // /** Export daily performance as chart */
  public get chart(): Chart {
    const df: DataFrame = this.book.export;
    const values = df
      .select((r) => r.action === "valuate")
      .records.map((r) => r.value) as number[];
    return new Chart(values, this.end);
  }
}
