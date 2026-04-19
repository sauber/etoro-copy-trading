/** Generate training data in csv file format */
import { DataFrame } from "@sauber/dataframe";
import { Backend } from "@sauber/journal";

import { Community, Investors, TestCommunity } from "📚/community/mod.ts";
import { makeRepository } from "📚/repository/mod.ts";

import { TrainingData } from "./trainingdata.ts";

// Minimum count of future bars to calculate score
const min_bars = 30;

// Assets
const path = Deno.args[0];
const repo: Backend = makeRepository(path);
const community: Community = new TestCommunity(repo);
const investors: Investors = await community.all();

// Training Data
const td = new TrainingData(min_bars);
const features: DataFrame = td.generate(investors);

console.log(features.length, "samples generated");
features.print("Training data");
