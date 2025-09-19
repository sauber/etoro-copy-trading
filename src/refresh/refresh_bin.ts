import { DiskBackend } from "@sauber/journal";
import type { DiscoverParameters } from "@sauber/etoro-investors";

import { Config } from "📚/config/mod.ts";
import type { Mirror } from "📚/repository/mod.ts";

import { FetchWebBackend } from "./fetch-web.ts";
import { type Blacklist, Refresh } from "./refresh.ts";

const path: string = Deno.args[0];
const repo: DiskBackend = new DiskBackend(path);
const config: Config = new Config(repo);

// Load and validate data from config repo
async function config_load<T>(property: string): Promise<T> {
  const value: T = (await config.get(property)) as T;
  if (!value) throw new Error(`Property ${property} not found in config`);
  return value;
}

const [id, filter, rate, blacklist] = await Promise.all([
  config_load<Mirror>("account"),
  config_load<Partial<DiscoverParameters>>("screener"),
  config_load<number>("rate"),
  config_load<Blacklist>("blacklist"),
]);

const fetcher: FetchWebBackend = new FetchWebBackend(rate);
const refresh: Refresh = new Refresh(repo, fetcher, id, filter, blacklist);
const count: number = await refresh.run();
console.log(`Assets downloaded: ${count}`);
