/** Train ranking model */

import { Assets } from "📚/assets/mod.ts";
import { Ranking } from "📚/ranking/ranking.ts";

const path = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`${path} does not exist.`);
const assets: Assets = Assets.disk(path);
const ranking: Ranking = assets.ranking;
if (!(await ranking.load())) {
  console.log("New model generated");
  ranking.generate();
} else {
  console.log("Model loaded.");
}
await ranking.train();
await ranking.save();
