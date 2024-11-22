import { Community } from "📚/repository/community.ts";
import { type Backend, CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import { NullStrategy, RSIStrategy } from "📚/timing/strategy.ts";
import { Exchange, Instruments, Simulation, Chart, Amount } from "@sauber/backtest";
import { TrainingData } from "📚/timing/trainingdata.ts";

type Charts = Array<Chart>;

// Initialize backend
function setupRepo(path: string): Backend {
  const disk = new DiskBackend(path);
  const backend = new CachingBackend(disk);
  return backend;
}

////////////////////////////////////////////////////////////////////////
/// Main
////////////////////////////////////////////////////////////////////////

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = setupRepo(path);
const community = new Community(repo);

// Training Data
const trainingdata = new TrainingData(community);
const data: Instruments = await trainingdata.load();
console.log("Instruments loaded:", data.length);

// Strategy
// const strategy = new NullStrategy();
const strategy = new RSIStrategy();

// Simulation
const exchange: Exchange = new Exchange(data);
const deposit: Amount = 10000;
const simulation = new Simulation(exchange, strategy, deposit);
simulation.run();

// Output
console.log(simulation.account.statement);
console.log("Omega Ratio:", simulation.stats.omegaRatio);
