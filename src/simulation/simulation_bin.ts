import { Community, type Investors } from "📚/repository/mod.ts";
import { CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { Simulation } from "📚/simulation/simulation.ts";
import { RandomStrategy } from "📚/simulation/strategy.ts";

// Community Repo
const path: string = Deno.args[0];
const backend = new DiskBackend(path);
const repo = new CachingBackend(backend);
export const community = new Community(repo);
const investors: Investors = await community.all();

// Start and end dates
const [start, _end] = (await Promise.all([
  community.start(),
  community.end(),
])) as [DateFormat, DateFormat];

const sim = new Simulation(start, "2022-04-27", investors, new RandomStrategy(investors, 1000));
sim.run();
console.log(sim.account.statement);

