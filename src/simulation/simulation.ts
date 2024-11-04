import { DateFormat, nextDate } from "📚/time/mod.ts";
import { Chart } from "📚/chart/mod.ts";
import type { Investors } from "📚/repository/mod.ts";
import { Strategy } from "./strategy.ts";
import { Account, Exchange, Position } from "@sauber/trading-account";

// type Name = Array<string>;
type Positions = Array<Position>;

/** Simulate trading over a period */
export class Simulation {
  private readonly exchange: Exchange = new Exchange();
  public readonly account: Account;
  private readonly dailyValue: number[] = [];

  constructor(
    private readonly start: DateFormat,
    private readonly end: DateFormat,
    private readonly investors: Investors,
    private readonly strategy: Strategy,
    private deposit: number = 100000,
  ) {
    this.account = new Account(deposit);
  }

  /** Identify which investors are active on any given day */
  private on(date: DateFormat): Investors {
    return this.investors.filter((i) =>
      i.chart.start >= date && i.chart.end <= date
    );
  }

  /** Open all positions suggested by strategy */
  private open(date: DateFormat): void {
    const order: Positions = this.strategy.buy(this.account.positions, date);
    order.forEach((p) => this.account.add(p, p.invested, new Date(date)));
  }

  /** Close all positions suggested by strategy */
  private close(date: DateFormat): void {
    const order: Positions = this.strategy.sell(this.account.positions, date);
    order.forEach((p) => this.account.remove(p, p.invested, new Date(date)));
  }

  /** Close any positions with expired underlying data */
  private expire(date: DateFormat): void {
    const positions = this.account.positions;
    const expired: Positions = positions.filter((p) =>
      !p.instrument.active(new Date(date))
    );
    const yesterday: DateFormat = nextDate(date, -1);
    const order: Positions = this.strategy.exit.sell(expired, yesterday);
    order.forEach((p) => this.account.remove(p, p.invested));
  }

  /** Calculate value of portfolio */
  private valuate(date: DateFormat): void {
    const value: number = this.account.value(new Date(date));
    this.dailyValue.push(value);
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
      this.step(date);
      date = nextDate(date);
    }
  }

  // /** Export daily performance as chart */
  public get chart(): Chart {
    return new Chart(this.dailyValue, this.end);
  }
}
