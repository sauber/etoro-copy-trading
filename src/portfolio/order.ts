/** An order contains biud and sell items that have not yet been executed */

import { Investor } from "📚/investor/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { Position } from "📚/portfolio/position.ts";

export type BuyItem = {
  investor: Investor;
  date: DateFormat;
  amount: number;
};
export type BuyItems = Array<BuyItem>;

export type SellItem = {
  position: Position;
  reason: string;
};
export type SellItems = Array<SellItem>;

export class Order {
  readonly buyItems: BuyItems = [];
  readonly sellItems: SellItems = [];

  public buy(items: BuyItems): Order {
    this.buyItems.push(...items);
    return this;
  }

  public sell(items: SellItems): Order {
    this.sellItems.push(...items);
    return this;
  }
}
