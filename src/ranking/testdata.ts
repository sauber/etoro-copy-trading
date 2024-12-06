import type { Investor } from "📚/investor/mod.ts";
import { Investors } from "📚/repository/mod.ts";
import { assets } from "📚/backend/testdata.ts";

export const community = assets.community;
export const investors: Investors = await community.all();
export const investor: Investor = await community.any();
