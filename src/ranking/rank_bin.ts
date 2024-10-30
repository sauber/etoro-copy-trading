/** Display sorted ranking of most recent investors */
import type { NetworkData } from "@sauber/neurons";
import { DataFrame } from "@sauber/dataframe";

import { CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import { Community } from "📚/repository/mod.ts";
import { DateFormat } from "📚/time/mod.ts";
import { Investor } from "📚/investor/mod.ts";

import { Model } from "📚/ranking/model.ts";
import { Ranking } from "📚/ranking/ranking.ts";

// Repo
if (!Deno.args[0]) throw new Error("Path missing");
const path: string = Deno.args[0];
const disk = new DiskBackend(path);
const backend = new CachingBackend(disk);

// Load Model
const modelAssetName = "ranking.network";
if (!await backend.has(modelAssetName)) {
  throw new Error("No ranking model exists. Perform training first.");
}
console.log("Loading existing model...");
const rankingparams = await backend.retrieve(modelAssetName) as NetworkData;
const model: Model = Model.import(rankingparams);
const ranking = new Ranking(model);

// Load list of investors
console.log("Loading latest investors...");
const community = new Community(backend);
const latest = await community.latest();
const end: DateFormat | null = await community.end();
if (!end) throw new Error("No end date in community");
console.log(`${end} investor count:`, latest.length);

// Predict SharpeRatio for each Investor
const sr: number[] = latest.map((i: Investor) => ranking.predict(i));

const df = DataFrame.fromRecords(
  latest.map((investor: Investor, index: number) => ({
    Investor: investor.UserName,
    SharpeRatio: sr[index],
  })),
).sort("SharpeRatio");

df.reverse.slice(0, 5).print("Desired Investor Ranking");
df.slice(0, 5).print("Undesired Investor Ranking");
