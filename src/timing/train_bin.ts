import { Community } from "📚/repository/community.ts";
import { type Backend, CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import type { Investors } from "📚/repository/mod.ts";
import type { Chart } from "📚/chart/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Random } from "📚/timing/strategy.ts";
import { simulation } from "📚/timing/simulation.ts";

type Charts = Array<Chart>;

// Initialize backend
function setupRepo(path: string): Backend {
  const disk = new DiskBackend(path);
  const backend = new CachingBackend(disk);
  return backend;
}

async function loadTrainingData(repo: Backend): Promise<Charts> {
  const community = new Community(repo);
  const investors: Investors = await community.all();
  const charts: Charts = investors.map((investor: Investor) => investor.chart);
  return charts;
}

////////////////////////////////////////////////////////////////////////
/// Main
////////////////////////////////////////////////////////////////////////

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = setupRepo(path);
// console.log(repo);

// Training Data
const data = await loadTrainingData(repo);
console.log("Charts loaded:", data.length);

// Strategy
const chart: Chart = data[0];
const strategy = new Random(chart);
// console.log(strategy);
const results = simulation(chart, strategy);
console.log(results);
