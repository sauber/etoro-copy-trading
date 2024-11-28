import { Amount, Exchange, Instruments, Simulation } from "@sauber/backtest";
import { Dashboard } from "@sauber/ml-cli-dashboard";
import { type Backend, CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import { Community } from "📚/repository/community.ts";
import { TrainingData } from "📚/timing/trainingdata.ts";
import { RSIStrategy } from "📚/timing/strategy.ts";
import {
  IntegerParameter,
  Parameter,
  Parameters,
} from "📚/optimize/parameter.ts";
import { Minimize } from "📚/optimize/minimize.ts";
import { printf } from "@std/fmt/printf";

// Number of parameters
type Inputs = [number, number, number];
type Output = number;

// Run simulation and return score
function runSim(
  window: number,
  buy: number,
  sell: number,
  display: boolean = false,
): number {
  const strategy = new RSIStrategy(Math.round(window), buy, sell);

  // Simulation
  const exchange: Exchange = new Exchange(data);
  const deposit: Amount = 10000;
  const simulation = new Simulation(exchange, strategy, deposit);
  simulation.run();
  const valuation = simulation.account.valuation.values;
  const gain = valuation[valuation.length - 1] / valuation[0];

  if (display) {
    const liquidity = simulation.stats.omegaRatio;
    console.log(simulation.account.statement);
    console.log(simulation.account.portfolio.statement(exchange.end));
    console.log("Omega Ratio:", liquidity, "Gain:", gain);
  }

  // Parameters to affect score:
  // - Gain
  // - Count of transactions
  // - Volatility
  // - Average amount invested

  // if (isNaN(liquidity)) return 0;
  // const score: number = Math.sqrt(liquidity * liquidity + gain * gain);
  // console.log("runSim", {gain, liquidity, score});
  return gain-1;
}

// Calculate loss
function loss(input: Inputs): Output {
  const score = runSim(...input);
  return -score;
}

// Status page need to probe two parameters
// a = Sell, b = Window
function sample(a: number, b: number): number {
  const window: number = b;
  const buy: number = parameters[1].value;
  const sell: number = a;
  return -runSim(window, buy, sell);
}

// Callback to dashboard from training
function status(
  iteration: number,
  xi: Array<number>,
  yi: Output,
  momentum: number,
): void {
  xs.push([xi[2], xi[0]]);
  ys.push(yi);
  console.log(dashboard.render(iteration, yi));
  // console.log(parameters.map(p=>p.print()).join(", "), yi);
}

////////////////////////////////////////////////////////////////////////
/// Main
////////////////////////////////////////////////////////////////////////

// Load training data
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const disk: Backend = new DiskBackend(path);
const backend: Backend = new CachingBackend(disk);
const community = new Community(backend);
const trainingdata = new TrainingData(community);
const data: Instruments = await trainingdata.load();
console.log("Instruments loaded:", data.length);

// Parameters
const parameters: Parameters = [
  new IntegerParameter(2, 100, "Window"),
  new Parameter(0, 50, "Buy"),
  new Parameter(50, 100, "Sell"),
];

// Trail of parameters towards minimum
const xs: Array<[number, number]> = [];
const ys: Array<Output> = [];

// const xs: Array<[number, number]> = Array.from(Array(100)).map(_=>[parameters[2].random, parameters[0].random]);
// const ys: Array<Output> = xs.map(x=>runSim(x[1], parameters[1].random, x[0]));
// console.log(xs, ys);

// Dashboard
// const epochs = 100;
const epochs = 500;
const width = 74;
const height = 12;
const dashboard = new Dashboard(
  width,
  height,
  xs,
  ys,
  sample,
  epochs,
  "Sell",
  "Window"
);

// Configure minimizer
const minimizer = new Minimize({
  parameters,
  loss: loss as (inputs: Array<number>) => number,
  epochs,
  status,
  every: 10,
  epsilon: 0.001,
  batchSize: 20,
});

// Run optimizer and print results
console.log("start", parameters.map((p) => p.print()));
const iterations = minimizer.run();
console.log(iterations, parameters.map((p) => p.print()));
console.log(parameters);
runSim(parameters[0].value, parameters[1].value, parameters[2].value, true);
