import { community } from "📚/repository/testdata.ts";
export { community, repo } from "📚/repository/testdata.ts";
export type { Investors } from "📚/repository/mod.ts";
import { Position } from "📚/portfolio/position.ts";
import type { DateFormat } from "📚/time/mod.ts";

// Random investor
export const investor = await community.any();

// Position data
const amount = 1000;
const open = investor.chart.start;
export const position = new Position(investor, open, amount);

// Date
export const date: DateFormat = "2022-04-25";
