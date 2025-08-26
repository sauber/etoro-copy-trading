import { assertEquals, assertInstanceOf } from "@std/assert";
import {
  Bar,
  CloseOrder,
  createTestInstrument,
  Instrument,
  Position,
  PositionID,
  Strategy,
  StrategyContext,
} from "@sauber/backtest";
import { TrailingStrategy } from "./trailing-strategy.ts";

// Generate a position
function makePosition(amount: number): Position {
  const instr: Instrument = createTestInstrument();
  const price = instr.price(instr.start);
  const units = amount / price;
  const id: PositionID = Math.floor(Math.random() * 1024 ** 3);
  const position = new Position(instr, amount, price, units, instr.start, id);
  return position;
}

Deno.test("Instance", () => {
  assertInstanceOf(new TrailingStrategy(1), TrailingStrategy);
});

Deno.test("List of Strategies", () => {
  // Create Strategy context with one position
  const position: Position = makePosition(1000);
  const co: CloseOrder = { position, confidence: 1, reason: "Close" };
  const end: Bar = position.instrument.end;
  const context: StrategyContext = {
    bar: end,
    value: 0,
    amount: 0,
    purchaseorders: [],
    closeorders: [co],
    positions: [],
  };
  const threshold: number = 0.95;
  const strategy: Strategy = new TrailingStrategy(threshold);

  assertEquals(strategy.open(context), []);
  // Position probably had a higher value at some point since time of open
  assertEquals(strategy.close(context).length, 1);
});
