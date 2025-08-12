import type { Investor } from "📚/investor/mod.ts";
import { Community, Investors } from "📚/community/mod.ts";
import { Backend } from "@sauber/journal";
import { makeTestRepository } from "../repository/mod.ts";

const repo: Backend = makeTestRepository();
export const community: Community = new Community(repo);
export const investors: Investors = await community.all();
export const investor: Investor = await community.any();
