/** Train ranking model */

import { Assets } from "📚/assets/mod.ts";
import { InvestorRanking } from "./investor-ranking.ts";

const path = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`${path} does not exist.`);
const assets: Assets = Assets.disk(path);
const ranking: InvestorRanking = assets.ranking;
if (!(await ranking.load())) {
  console.log("New model generated");
  ranking.generate();
} else {
  console.log("Model loaded.");
}
const improvement = await ranking.train();
if (improvement > 0) {
  await ranking.save();
  console.log("Model saved with improvement:", improvement);
}
