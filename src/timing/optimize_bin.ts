import {
  Amount,
  Exchange,
  Instrument,
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
import { correlation } from "jsr:@sauber/statistics";

// Number of parameters
type Inputs = [number, number, number, number];
type Output = number;

// Sanity check loaded data
function verify(instruments: Instruments): void {
  instruments.forEach((instrument: Instrument) => {
    if (isNaN(instrument.start)) {
      console.log(instrument);
      throw new Error("Invalid start date for " + instrument.symbol);
    }
  });
}

// Run simulation and return score
function runSim(
  inputs: Inputs,
  display: boolean = false,
): number {
  const [window, buy, sell, weekday] = inputs;
  const strategy = new RSIStrategy(
    Math.round(window),
    buy,
    sell,
    Math.round(weekday),
  );

  // Simulation
  // const exchange: Exchange = new Exchange(instruments);
  const deposit: Amount = 10000;
  const simulation = new Simulation(exchange, strategy, deposit);
  simulation.run();
  const stats: Stats = simulation.stats;
  const trades: number = stats.trades.length;
  const profit: number = stats.profit;
  const invested: number = stats.InvestedRatio;
  const win: number = stats.WinRatio;

  const pct = (p: number): string => (p * 100).toFixed(2) + "%";

  if (display) {
    console.log(simulation.account.statement);
    console.log(simulation.account.portfolio.statement(exchange.end));
    console.log(
      `Profit: ${pct(profit)}`,
      `Trades: ${trades}`,
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
  // Normalize costs: 0=no cost, 1=worst cost
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
  const score = runSim(input);
  return -score;
}

// Status page need to probe two parameters
function sample(x: number, y: number): number {
  const inputs = parameters.map((p, i) => {
    if (i === xcol) return x;
    else if (i === ycol) return y;
    else return p.value;
  }) as Inputs;
  return -runSim(inputs);
}

// Callback to dashboard from training
function status(
  iteration: number,
  xi: Array<number>,
  yi: Output,
  _momentum: number,
): void {
  xs.push([xi[xcol], xi[ycol]]);
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
const instruments: Instruments = await trainingdata.load();
// verify(instruments);
console.log("Instruments loaded:", instruments.length);
const exchange: Exchange = new Exchange(instruments);

// Parameters
const parameters: Parameters = [
  new IntegerParameter("Window", 2, 100),
  new Parameter("Buy", 0, 50),
  new Parameter("Sell", 50, 100),
  new IntegerParameter("Weekday", 1, 5),
];

// Run simulation on random parameters within boundaries to find best starting point
const start_samples = 200;
const xi: Array<Inputs> = Array(start_samples);
const yi: Array<Output> = Array(start_samples);
let best = -Infinity;
for (let i = 0; i < start_samples; i++) {
  const inputs = parameters.map((p) => p.random) as Inputs;
  const output = runSim(inputs);
  xi[i] = inputs;
  yi[i] = output;
  if (output > best) {
    // console.log("Best", i, inputs, output);
    inputs.map((v, i) => parameters[i].set(v));
    best = output;
  }
}

// Which input correlates most to output
const correlations: Array<[number, number]> = parameters.map((_, c: number) =>
  [c, Math.abs(correlation(xi.map((r) => r[c]), yi))] as [number, number]
).sort((a,b)=>b[1]-a[1]);

// Which parameters to display on scatter chart
const xcol: number = correlations[0][0];
const xlabel: string = parameters[xcol].name;
const ycol: number = correlations[1][0];
const ylabel: string = parameters[ycol].name;
// console.log({correlations, xcol, xlabel, ycol, ylabel});

// Trail of parameters towards minimum
const xs: Array<[number, number]> = [];
const ys: Array<Output> = [];

// Dashboard
// const epochs = 20000;
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
  xlabel,
  ylabel,
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
runSim(parameters.map((p) => p.value) as Inputs, true);
// TODO: Display graph of valuation chart
// TODO: Reserve some data as validate data, and run simulation on it
