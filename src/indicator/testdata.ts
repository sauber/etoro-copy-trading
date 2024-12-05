import { repo } from "📚/repository/testdata.ts";
import { Community } from "📚/repository/mod.ts";
import type { Investors } from "📚/repository/mod.ts";
import { Investor } from "📚/investor/mod.ts";
import { Position } from "📚/portfolio/position.ts";

// Investors
const community = new Community(repo);
export const investors: Investors = await community.all();
export const investor: Investor = await community.any();

// Position data
const amount = 1000;
const open = investor.chart.start;
export const position = new Position(investor, open, amount);
