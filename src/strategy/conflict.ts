import { BuyOrder, SellOrder } from "@sauber/backtest";

// Confirm that we are not trying to open and close the same instrument on the same tick
export function checkConflicts(
  open: BuyOrder[],
  close: SellOrder[],
): boolean {
  const closeInstruments = new Set(close.map((o) => o.position.instrument));
  const openInstruments = new Set(open.map((o) => o.instrument));
  const conflictingInstruments = [...closeInstruments].filter((i) =>
    openInstruments.has(i)
  );

  if (conflictingInstruments.length > 0) {
    console.warn(
      "Conflicting buy and sell orders for same instruments:",
    );
    conflictingInstruments.forEach((i) => {
      const symbol = i.symbol;
      close.filter((o) => o.position.instrument.symbol === symbol).map((o) =>
        console.log(o.reason, symbol, o.position.start)
      );
      open.filter((o) => o.instrument.symbol === symbol).map((o) =>
        console.log("Buy", symbol, o.amount)
      );
    });
    throw new Error(
      "Error: Conflicting buy and sell orders for same instruments",
    );
  }
  return true;
}
