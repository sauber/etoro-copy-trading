export * from "📚/repository/chart.ts";
export * from "📚/repository/portfolio.ts";
export * from "📚/repository/stats.ts";
export * from "📚/repository/discover.ts";
export * from "📚/repository/types.ts";
export * from "📚/repository/investor-assembly.ts";

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
