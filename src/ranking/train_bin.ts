/** Train ranking model */

import { InvestorRanking } from "./investor-ranking.ts";
import { makeRepository } from "../repository/mod.ts";
import { Backend } from "@sauber/journal";

const path: string = Deno.args[0];
const repo: Backend = makeRepository(path);

const ranking: InvestorRanking = new InvestorRanking(repo);
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
} else {
  console.log("Model not improved and not saved:", improvement);
}
