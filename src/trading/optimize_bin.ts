import { Exchange, Instruments } from "@sauber/backtest";
import { type Backend, CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import { Community } from "📚/repository/community.ts";
import { Dashboard, Parameters, Status } from "📚/optimize/mod.ts";
import { Config } from "📚/config/config.ts";
import { TrainingData } from "📚/technical/trainingdata.ts";
import { Optimize, TimingData } from "📚/trading/optimize.ts";

////////////////////////////////////////////////////////////////////////
/// Main
////////////////////////////////////////////////////////////////////////

const modelAssetName = "technical";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const disk: Backend = new DiskBackend(path);
const backend: Backend = new CachingBackend(disk);

// Load training data
const community = new Community(backend);
const trainingdata = new TrainingData(community);
const instruments: Instruments = await trainingdata.load();
// verify(instruments);
console.log("Instruments loaded:", instruments.length);
const exchange: Exchange = new Exchange(instruments);

// Load Parameters into model
// TODO: Integer or float parameter?
const config = new Config(backend);
const timingData = await config.get(modelAssetName) as TimingData;
const model = timingData ? Optimize.import(timingData) : new Optimize();

const epochs = 100;
const dashboard: Dashboard = new Dashboard(epochs, 38);

const status: Status = (
  iterations: number,
  _momentum: number,
  parameters: Parameters,
) => console.log(dashboard.render(parameters, iterations));

// Run optimizer and print results
// console.log("start", model.print));
const epsilon = 0.01;
const iterations = model.optimize(exchange, epochs, epsilon, status);
const exported: TimingData = model.export();
// await config.set(modelAssetName, exported);
console.log(iterations, exported);
// console.log(parameters);
// runSim(parameters.map((p) => p.value) as Inputs, true);
// TODO: Display graph of valuation chart
// TODO: Reserve some data as validate data, and run simulation on it
