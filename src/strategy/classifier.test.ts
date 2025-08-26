import {
  assertAlmostEquals,
  assertEquals,
  assertInstanceOf,
} from "@std/assert";
import { CloseOrders, PurchaseOrders } from "@sauber/backtest";
import { DataFrame } from "@sauber/dataframe";
import { Classifier } from "./classifier.ts";
import {
  context,
  test_ranking as ranking,
  test_timing as timing,
} from "./testdata.ts";

Deno.test("Instance", () => {
  assertInstanceOf(new Classifier(context, ranking, timing, 0.1), Classifier);
});

Deno.test("Records", { ignore: true }, () => {
  const classifier = new Classifier(context, ranking, timing, 0.1);
  const records = classifier.records;
  const df = DataFrame.fromRecords(records);
  df
    .sort("Timing", false)
    .sort("Rank", false)
    .sort("Value")
    .sort("Sell")
    .sort("Buy", false)
    .digits(2)
    .print("Candidates");
});

Deno.test("Open New Positions", () => {
  const classifier = new Classifier(context, ranking, timing, 0.1);
  const pos: PurchaseOrders = classifier.open();
  assertEquals(pos.length, 1);
  assertEquals(pos[0].instrument.symbol, "SanjaySoni1812");
  assertAlmostEquals(pos[0].amount, 2308, 1);
});

Deno.test("Close Existing Positions", () => {
  const classifier = new Classifier(context, ranking, timing, 0.1);
  const cos: CloseOrders = classifier.close();
  assertEquals(cos.length, 13);
  assertEquals(cos[0].position.instrument.symbol, "MilanIvann");
});
