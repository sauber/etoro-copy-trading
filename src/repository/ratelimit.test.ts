import { assert, assertInstanceOf, assertLess } from "@std/assert";
import { RateLimit } from "./ratelimit.ts";
const rate = 1000;

const callback = function (): Promise<number> {
  return Promise.resolve(Math.random());
};

Deno.test("Blank Initialization", () => {
  const f = new RateLimit(0);
  assertInstanceOf(f, RateLimit);
});

Deno.test("Sequential", async (t) => {
  const rl = new RateLimit(rate);
  const begin = new Date();

  await t.step("first limit", async () => {
    const start = new Date();
    const result = (await rl.limit(callback)) as number;
    assertLess(result, 1);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    assert(diff < rate);
  });

  await t.step("second limit", async () => {
    const start = new Date();
    const result = (await rl.limit(callback)) as number;
    assertLess(result, 1);
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    assert(diff < rate, `Diff should be less that rate: ${diff} < ${rate}`);
    assert(
      end.getTime() - begin.getTime() >= rate,
      `Diff since beginning should be more than rate: ${end.getTime()} - ${begin.getTime()} > ${rate}`
    );
  });

  await t.step("third limit", async () => {
    const result = (await rl.limit(callback)) as number;
    assertLess(result, 1);
    const end = new Date();
    const diff = end.getTime() - begin.getTime();
    assert(diff >= 2 * rate, `diff ${diff} >= 2 * rate ${rate}`);
  });
});

Deno.test("Parallel", async (t) => {
  const rl = new RateLimit(rate);

  await t.step("parallel limits", async () => {
    const start = performance.now();
    const prom1 = rl.limit(callback);
    const prom2 = rl.limit(callback);
    const prom3 = rl.limit(callback);
    await Promise.all([prom1, prom2, prom3]);
    const end = performance.now();
    const diff = end - start;
    assert(diff >= 1.9 * rate);
    assert(diff < 3 * rate);
  });
});
