import { Instrument, makeInstrument, OpenPosition } from "@sauber/backtest";
import { assert, assertEquals, assertNotEquals } from "@std/assert";

import { Tick } from "📚/tick/mod.ts";

import { multiposition } from "./multiposition.ts";
import { DELAY } from "./delay.ts";

const instrument1: Instrument = makeInstrument(100);
const instrument2: Instrument = makeInstrument(200);
const start: Tick = Math.max(
  ...[instrument1, instrument2].map((instr) => instr.start),
);
const positions: OpenPosition[] = [
  new OpenPosition(instrument1, start, 1000, 10),
  new OpenPosition(instrument1, start, 500, 5),
  new OpenPosition(instrument2, start, 2000, 10),
];
const tick: Tick = start + DELAY;

Deno.test("Multiposition count", () => {
  const bundle = multiposition(positions, tick);
  assert(bundle.length === 2, "Should have two bundles");
});

Deno.test("Multiposition value and invested", () => {
  const bundle = multiposition(positions, tick);

  const bundle1 = bundle.find((b) => b.positions[0].instrument === instrument1);
  const bundle2 = bundle.find((b) => b.positions[0].instrument === instrument2);

  assert(bundle1 !== undefined, "Bundle for instrument1 should exist");
  assert(bundle2 !== undefined, "Bundle for instrument2 should exist");

  assertEquals(bundle1!.invested, 1500, "Bundle1 invested should be 1500");
  assertNotEquals(bundle1!.value, 1500, "Bundle1 value should be 1500");

  assertEquals(bundle2!.invested, 2000, "Bundle2 invested should be 2000");
  assertNotEquals(bundle2!.value, 2000, "Bundle2 value should be 1000");
});
