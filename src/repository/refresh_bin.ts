import { DiskBackend } from "../storage/disk-backend.ts";
import { FetchWebBackend } from "./fetch-web.ts";
import { Refresh } from "./refresh.ts";
import { Config } from "📚/config/config.ts";
import type { DiscoverFilter } from "./mod.ts";
import type { InvestorId } from "📚/repository/mod.ts";

const path: string = Deno.args[0];
const repo: DiskBackend = new DiskBackend(path);

const config: Config = new Config(repo);
const id = await config.get("investor") as InvestorId;
const filter = await config.get("discover") as DiscoverFilter;
const rate = await config.get("rate") as number;
const blacklist = await config.get("blacklist") as Record<string, Record<string, unknown>>;

const fetcher: FetchWebBackend = new FetchWebBackend(rate);
const refresh: Refresh = new Refresh(repo, fetcher, id, filter, blacklist);
const count: number = await refresh.run();
console.log(`Assets downloaded: ${count}`);
