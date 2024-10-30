import { DiskBackend, CachingBackend } from "📚/storage/mod.ts";
import { Config } from "📚/config/config.ts";

// Community Repo
const path: string = Deno.args[0];
const backend = new DiskBackend(path);
const repo = new CachingBackend(backend);

const config = new Config(repo);
await config.renew();
