import { Exchange, Instruments } from "@sauber/backtest";
import { Dashboard, Parameters, Status } from "@sauber/optimize";
import { Optimize } from "./optimize.ts";
import { Assets } from "📚/assets/mod.ts";
import { Loader } from "./loader.ts";
import { makeRanker, Rater } from "./raters.ts";
import { InvestorRanking, Ranking } from "📚/ranking/mod.ts";
import { ParameterData } from "./parameters.ts";
import { RankingCache } from "📚/ranking/ranking-cache.ts";
import { TestLoader } from "./test-loader.ts";

////////////////////////////////////////////////////////////////////////
/// Main
////////////////////////////////////////////////////////////////////////

const modelAssetName = "trading";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo: Assets = Assets.disk(path);
const loader: Loader = new TestLoader(repo);

// Ranking Model
const ranking: InvestorRanking = await loader.rankingModel();
const cache: Ranking = new RankingCache(ranking);
const ranker: Rater = makeRanker(cache);

// Load training data
const instrument_count: number = 800;
const instruments: Instruments = await loader.instrumentSamples(
  instrument_count,
);
console.log("Testing Instruments loaded:", instruments.length);
const spread = 0.001;
const exchange: Exchange = new Exchange(instruments, spread);

// Load Validation data
const validation_count: number = 800;
const validationInstruments: Instruments = await loader.instrumentSamples(
  validation_count,
);
console.log("Validation Instruments loaded:", validationInstruments.length);
const validation: Exchange = new Exchange(instruments, spread);

// Load Parameters into model
const config = repo.config;
const settings = await config.get(modelAssetName) as ParameterData;
const loaded: boolean = settings !== null;
const model = loaded
  ? Optimize.import(settings, ranker)
  : Optimize.generate(exchange, 150, ranker);
if (loaded) console.log("Loaded settings:", settings);
else console.log("Best random starting point:", model.export());

// Dashboard
const epochs = 100;
const console_width = 88;
const dashboard: Dashboard = new Dashboard(epochs, console_width);
const status: Status = (
  iterations: number,
  _momentum: number,
  parameters: Parameters,
  reward: number[],
) => console.log(dashboard.render(parameters, iterations, reward));

// Confirm starting score
const initialScore: number = model.predict(validation);
console.log("Initial score:", initialScore);

// Run optimizer and save results
const epsilon = 0.01;
const _iterations: number = model.optimize(exchange, epochs, epsilon, status);

// Confirm final score
const finalScore: number = model.predict(validation);
console.log("Final score:", finalScore);

// Save model only if score improved
if (finalScore > initialScore) {
  const exported: ParameterData = model.export();
  console.log("Saved settings: ", exported);
  await config.set(modelAssetName, exported);
}
