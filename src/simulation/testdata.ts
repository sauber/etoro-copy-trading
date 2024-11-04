import { repo } from "📚/repository/testdata.ts";
import { Community } from "📚/repository/mod.ts";
export type { Investors } from "📚/repository/mod.ts";
import { Investor } from "📚/investor/mod.ts";

// Testdata based Community
export const community = new Community(repo);

// Pick a random investor
export const investor: Investor = await community.any();
