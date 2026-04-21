import { Amount, OpenPosition } from "@sauber/backtest";
import { Tick } from "📚/tick/mod.ts";
import { Symbol } from "📚/strategy/parameters.ts";

// Combine positions of same instrument into one, to calculate value at tick
type Bundled = { positions: OpenPosition[]; value: Amount; invested: Amount };
export const multiposition = (
  positions: OpenPosition[],
  tick: Tick,
): Array<Bundled> => {
  const bundled: Record<Symbol, Bundled> = {};
  for (const position of positions) {
    const symbol: Symbol = position.instrument.symbol;
    if (!bundled[symbol]) {
      bundled[symbol] = { positions: [], value: 0, invested: 0 };
    }
    bundled[symbol].positions.push(position);
  }
  // Flatten dict to list
  const bundledList: Array<Bundled> = Object.values(bundled);

  // Summarize value and invested amount of combined positions at tick
  bundledList.forEach((bundle) => {
    const instrument = bundle.positions[0].instrument;
    const price = instrument.price(tick);
    // Calculate total value
    bundle.value = price *
      bundle.positions.reduce((sum, p) => sum + p.quantity, 0);

    // Calculate total invested amount
    bundle.invested = bundle.positions.reduce((sum, p) => sum + p.invested, 0);
  });

  return bundledList;
};
