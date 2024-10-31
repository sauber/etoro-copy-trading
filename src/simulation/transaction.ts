import type { DateFormat } from "📚/time/mod.ts";
import type { Book } from "📚/simulation/book.ts";
import type { Portfolio } from "📚/portfolio/mod.ts";
import type { Exchange } from "📚/simulation/exchange.ts";
import type { Investor } from "📚/investor/mod.ts";
import type { Position } from "📚/portfolio/position.ts";

/** Abstract class for transaction */
abstract class Transaction {
  constructor(protected readonly date: DateFormat) {}

  public abstract execute(book: Book, portfolio: Portfolio): boolean;
}

/** Deposit transaction */
export class Deposit extends Transaction {
  constructor(date: DateFormat, private readonly amount: number) {super(date)}

  public override execute(book: Book, _portfolio: Portfolio): boolean {
    book.deposit(this.date, this.amount);
    return true;
  } 
}

// export class Buy extends Transaction {
//   private fee: number = 0;
//   private readonly text: string;

//   constructor(
//     date: DateFormat,
//     private readonly amount: number,
//     private readonly investor: Investor,
//   ) {
//     super(date);
//     this.text = `Buy ${amount} of ${investor.UserName}`;
//   }

//   public execute(
//     book: Book,
//     portfolio: Portfolio,
//     exchange: Exchange,
//   ): boolean {
//     const position: Position = exchange.buy(
//       this.investor,
//       this.date,
//       this.amount,
//     );

//     // Is cash available?
//     if ( this.amount > book.cash ) return false;

//     this.fee = this.amount - position.value(this.date);
//     book.add(this);
//     portfolio.add(position);
//     return true;
//   }
// }
