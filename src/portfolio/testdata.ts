import { community, repo } from "📚/repository/testdata.ts";
export { community, repo } from "📚/repository/testdata.ts";
export type { Investors } from "📚/repository/mod.ts";
import { Position } from "./position.ts";
import type { DateFormat } from "📚/time/mod.ts";
import { Ranking } from "📚/ranking/mod.ts";

// Random investor
export const investor = await community.any();

// Position data
const amount = 1000;
const open = investor.chart.start;
export const position = new Position(investor, open, amount);

// Date
export const date: DateFormat = "2022-04-25";

// Ranking
// export const investors = await community.on(date);
// const model = new Ranking(repo);
// const predict = await model.predict(investors, date);
// export const conviction = Object.fromEntries(
//   predict.records.map(record => [record.UserName, record.SharpeRatio])
// );
