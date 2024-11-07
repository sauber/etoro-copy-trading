import { DateFormat, nextDate } from "📚/time/mod.ts";
import { Chart } from "📚/chart/mod.ts";
import type { Investors } from "📚/repository/mod.ts";
import { Position, Strategy } from "./strategy.ts";
import { Account, Exchange } from "@sauber/trading-account";
import { InvestorInstrument } from "📚/simulation/investor-instrument.ts";

// type Name = Array<string>;
type Positions = Array<Position>;

/** Simulate trading over a period */
export class Simulation {
  private readonly exchange: Exchange = new Exchange();
  public readonly account: Account;
  private readonly dailyValue: number[] = [];
  private readonly all: Strategy;

  constructor(
    private readonly start: DateFormat,
    private readonly end: DateFormat,
    private readonly investors: Investors,
    private readonly strategy: Strategy,
    private deposit: number = 100000,
  ) {
    this.account = new Account(deposit);
    this.all = new Strategy({ investors });
  }

  /** Identify which investors are active on any given day */
  private on(date: DateFormat): Strategy {
    // return this.investors.filter((i) =>
    //   i.chart.start >= date && i.chart.end <= date
    // );
    return new Strategy({ date }).active();
  }

  /** Open all positions suggested by strategy */
  private open(date: DateFormat, strategy: Strategy): void {
    const order: Positions = strategy.buy();
    order.forEach((p) => this.account.add(p, p.invested, new Date(date)));
  }

  /** Close all positions suggested by strategy */
  private close(date: DateFormat, strategy: Strategy): void {
    const order: Positions = strategy.sell();
    order.forEach((p) => this.account.remove(p, p.invested, new Date(date)));
  }

  /** Close any positions with expired underlying data */
  private expire(date: DateFormat): void {
    // const portfolio = this.account.portfolio;
    // const strategy: Strategy = this.all.append(new Strategy({date, portfolio})).expired();

    // const expired: Portfolio = strategy.sell();
    // const yesterday: DateFormat = nextDate(date, -1);
    // const order: Positions = this.strategy.exit().sell(expired, yesterday);
    // order.forEach((p) => this.account.remove(p, p.invested));
    const time: Date = new Date(date);
    for (const p of this.account.positions) {
      if (!p.instrument.active(time)) this.account.remove(p, p.invested);
    }
  }

  /** Calculate value of portfolio */
  private valuate(date: DateFormat): void {
    const value: number = this.account.value(new Date(date));
    this.dailyValue.push(value);
  }

  /** Run a trading session on a particlar date */
  private step(date: DateFormat): void {
    const today: Strategy = this.all.append(this.on(date));
    const trading: Strategy = today.append(this.strategy);

    this.expire(date);
    this.valuate(date);
    this.close(date, trading);
    this.open(date, trading);
  }

  /** Run a trading sesssion each day in period */
  public run(): void {
    let date = this.start;
    while (date <= this.end) {
      this.step(date);
      date = nextDate(date);
    }
  }

  // /** Export daily performance as chart */
  public get chart(): Chart {
    return new Chart(this.dailyValue, this.end);
  }
}
