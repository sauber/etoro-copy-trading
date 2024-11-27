import { Community } from "📚/repository/community.ts";
import { type Backend, CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import { RSIStrategy } from "📚/timing/strategy.ts";
import {
  Amount,
  Chart,
  Exchange,
  Instruments,
  Simulation,
} from "@sauber/backtest";
import { TrainingData } from "📚/timing/trainingdata.ts";
import { Parameter } from "📚/optimize/parameter.ts";

type Charts = Array<Chart>;

// Initialize backend
function setupRepo(path: string): Backend {
  const disk = new DiskBackend(path);
  const backend = new CachingBackend(disk);
  return backend;
}

// Run simulation and return score
function runSim(
  window: number,
  buy: number,
  sell: number,
  display: boolean = false,
): number {
  const strategy = new RSIStrategy(window, buy, sell);

  // Simulation
  const exchange: Exchange = new Exchange(data);
  const deposit: Amount = 10000;
  const simulation = new Simulation(exchange, strategy, deposit);
  simulation.run();
  const valuation = simulation.account.valuation.values;
  const gain = valuation[valuation.length - 1] / valuation[0];
  const liquidity = simulation.stats.omegaRatio;

  if (display) {
    console.log(simulation.account.statement);
    console.log(simulation.account.portfolio.statement(exchange.end));
    console.log("Omega Ratio:", liquidity, "Gain:", gain);
  }

  const score: number = Math.sqrt(liquidity * liquidity + gain * gain);
  return score;
}

type Param = [number, number, number];
type Range = { min: number; max: number };
type Limits = [Range, Range, Range];

// Run simulation with one parameter changed
function runVariant(
  column: number,
  offset: number,
  orig: Param,
  limits: Limits,
): number {
  // Out of bounds
  if (
    orig[column] + offset > limits[column].max ||
    orig[column] + offset < limits[column].min
  ) return 0;

  const params: Param = [...orig];
  params[column] += offset;
  const result = runSim(...params);
  console.log("variant", result, "=", params);
  return result;
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

// Window, buy_threshold, sell_threshold
const range: Limits = [
  { min: 2, max: 100 },
  { min: 0, max: 50 },
  { min: 50, max: 100 },
];

// Parameters
// const parameters: Parameter = [
//   new Parameter(2, 100, "Window"),
//   new Parameter(0, 50, "Buy"),
//   new Parameter(50, 100, "Sell"),
// ];

// Random start point
const optimal = range.map((p: Range) =>
  p.min + Math.round(Math.random() * (p.max - p.min))
) as Param;
console.log({ optimal });

let omegaScore = 0;
let prevScore = 0;
do {
  console.log({ optimal, omegaScore, prevScore });
  prevScore = omegaScore;

  for (const column of [0, 1, 2]) {
    for (const offset of [-20, -10, -5, -2, -1, 1, 2, 5, 19, 20]) {
      const score = runVariant(column, offset, optimal, range);
      if (score > omegaScore) {
        omegaScore = score;
        optimal[column] += offset;
        break;
      }
    }
  }
} while (omegaScore > prevScore);
runSim(...optimal, true);
console.log(omegaScore, optimal);
