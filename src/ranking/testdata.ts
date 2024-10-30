import { repo } from "📚/repository/testdata.ts";
import { Community } from "📚/repository/mod.ts";
import type { Investor } from "📚/investor/mod.ts";
import { Investors } from "📚/repository/mod.ts";

export const community = new Community(repo);
export const investors: Investors = await community.all();
export const investor: Investor = await community.any();
