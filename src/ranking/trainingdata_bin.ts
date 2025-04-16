/** Generate training data in csv file format */
import { TrainingData } from "📚/ranking/trainingdata.ts";
import { Assets } from "📚/assets/mod.ts";
import { Community, Investors } from "📚/repository/mod.ts";
import { DataFrame } from "@sauber/dataframe";

// Minimum count of future bars to calculate score
const min_bars = 30;

// Assets
const path = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`${path} does not exist.`);
const assets: Assets = Assets.disk(path);
const community: Community = assets.community;
const investors: Investors = await community.all();

// Training Data
const td = new TrainingData(min_bars);
const features: DataFrame = td.generate(investors);

console.log(features.length, "samples generated");
features.print("Training data");
