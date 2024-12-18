import { Exchange, Instruments } from "@sauber/backtest";
import { Dashboard, Parameters, Status } from "📚/optimize/mod.ts";
import { Optimize, TradingData } from "📚/trading/optimize.ts";
import { Assets } from "📚/assets/mod.ts";
import { Loader } from "📚/trading/loader.ts";

////////////////////////////////////////////////////////////////////////
/// Main
////////////////////////////////////////////////////////////////////////

const modelAssetName = "trading";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo: Assets = Assets.disk(path);
const loader: Loader = new Loader(repo);

// Load training data
const instruments: Instruments = await loader.instrumentSamples(400);
console.log("Instruments loaded:", instruments.length);
const exchange: Exchange = new Exchange(instruments);

// Load Parameters into model
const config = repo.config;
const settings = await config.get(modelAssetName) as TradingData;
console.log("Loaded settings:", settings);
const model = settings
  ? Optimize.import(settings)
  : Optimize.best(200, exchange);

// Dashboard
const epochs = 100;
const dashboard: Dashboard = new Dashboard(epochs, 38);
const status: Status = (
  iterations: number,
  _momentum: number,
  parameters: Parameters,
) => console.log(dashboard.render(parameters, iterations));

// Run optimizer and save results
const epsilon = 0.01;
const _iterations: number = model.optimize(exchange, epochs, epsilon, status);
const exported: TradingData = model.export();
console.log("Saved settings: ", exported);
await config.set(modelAssetName, exported);
