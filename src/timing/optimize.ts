import {
  Amount,
  Exchange,
  Instruments,
  Simulation,
  Stats,
} from "@sauber/backtest";
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
  const stats: Stats = simulation.stats;
  const trades: number = stats.trades.length;
  const profit: number = stats.profit;
  const invested: number = stats.InvestedRatio;
  const win: number = stats.WinRatio;

  function pct(p: number): string {
    return (p * 100).toFixed(2) + "%";
  }

  if (display) {
    console.log(simulation.account.statement);
    console.log(simulation.account.portfolio.statement(exchange.end));
    console.log(
      `Trades: ${trades}`,
      `Profit: ${pct(profit)}`,
      `Invested: ${pct(invested)}`,
      `Win: ${pct(win)}`,
    );
  }

  // Parameters to affect score:
  // - Gain
  // - Count of transactions
  // - Volatility
  // - Average amount invested

  const scale: number = Math.abs(profit);
  // Costs are 0=no cost, 1=worst cost
  // The more trades the worse
  const trades_cost: number = Math.tanh(
    trades / simulation.account.valuation.length,
  );
  // The more uninvested cash invested the worse
  const cash_cost = 1 - invested;
  // The more losses the worse
  const lose_cost = 1 - win;
  // Scale each cost to profit
  const costs = scale * (trades_cost + cash_cost + lose_cost) / 3;
  // Subtract cost from profit;
  const score = profit - costs;

  return score;
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
  "Window",
);

// Configure minimizer
const minimizer = new Minimize({
  parameters,
  loss: loss as (inputs: Array<number>) => number,
  epochs,
  status,
  every: 10,
  epsilon: 0.0001,
  batchSize: 20,
});

// Run optimizer and print results
console.log("start", parameters.map((p) => p.print()));
const iterations = minimizer.run();
console.log(iterations, parameters.map((p) => p.print()));
// console.log(parameters);
runSim(parameters[0].value, parameters[1].value, parameters[2].value, true);
