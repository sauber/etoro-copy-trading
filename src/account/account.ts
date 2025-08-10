// Information about trading account

import { createMutex } from "@117/mutex";
import { Config } from "../config/mod.ts";
import { Mirror } from "../repository/portfolio.ts";
import { Backend } from "@sauber/journal";
import { Amount } from "@sauber/backtest";

/** Load username from config */
export class Account {
  constructor(private readonly repo: Backend) {
  }

  /** Load all account data only once */
  private readonly account_lock = createMutex();
  private _account: Mirror | null = null;
  private async load(): Promise<Mirror> {
    if (this._account !== null) return this._account;
    await this.account_lock.acquire();
    try {
      // If account already loaded, return it
      if (this._account !== null) return this._account;
      const config = new Config(this.repo);
      const account: Mirror = await config.get("account") as Mirror;
      this._account = account;
      return account;
    } finally {
      this.account_lock.release();
    }
  }

  /** Username of account */
  public async username(): Promise<string> {
    return (await this.load()).UserName;
  }

  /** Total value of account */
  public async value(): Promise<Amount> {
    const value: number = (await this.load()).Value;
    if (value == null) throw new Error("Account Value is null");
    return (await this.load()).Value;
  }
}
