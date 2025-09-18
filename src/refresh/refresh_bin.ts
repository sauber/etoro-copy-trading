import { DiskBackend } from "@sauber/journal";
import type { DiscoverParameters } from "@sauber/etoro-investors";

import { Config } from "📚/config/config.ts";
import type { Mirror } from "📚/repository/mod.ts";

import { FetchWebBackend } from "./fetch-web.ts";
import { type Blacklist, Refresh } from "./refresh.ts";

const path: string = Deno.args[0];
const repo: DiskBackend = new DiskBackend(path);

const config: Config = new Config(repo);
const id = await config.get("account") as Mirror;
const filter = await config.get("screener") as DiscoverParameters;
const rate = await config.get("rate") as number;
const blacklist = await config.get("blacklist") as Blacklist;

const fetcher: FetchWebBackend = new FetchWebBackend(rate);
const refresh: Refresh = new Refresh(repo, fetcher, id, filter, blacklist);
const count: number = await refresh.run();
console.log(`Assets downloaded: ${count}`);
