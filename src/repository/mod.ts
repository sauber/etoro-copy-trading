export type { StatsExport } from "📚/repository/stats.ts";
export type { InvestorId } from "📚/repository/types.ts";
export type { Mirror } from "📚/repository/portfolio.ts";

import { Backend, CachingBackend, DiskBackend } from "@sauber/journal";

/** Use repository at path */
export function makeRepository(diskpath: string): Backend {
  if (!Deno.statSync(diskpath)) throw new Error(`${diskpath} does not exist.`);
  const disk: Backend = new DiskBackend(diskpath);
  const cache: Backend = new CachingBackend(disk);
  return cache;
}

/** Repository of test data */
export function makeTestRepository(): Backend {
  return makeRepository("testdata");
}
