import type { DateFormat } from "../time/mod.ts";
import { repo } from "📚/repository/testdata.ts";
import { Community } from "📚/repository/mod.ts";
export type { Investors } from "📚/repository/mod.ts";
import { Chart } from "📚/chart/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Position } from "📚/portfolio/position.ts";

// Testdata based Community
export const community = new Community(repo);

// Pick a random investor
export const investor: Investor = await community.any();
// export const username: string = investor.UserName;

// Chart data
const chart: Chart = investor.chart;
const open: DateFormat = chart.start;
// const price: number = chart.first * 1.000; // No spread

// Position data
const amount = 1000;
export const position = new Position(investor, open, amount);
