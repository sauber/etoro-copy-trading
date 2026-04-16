import type { Investor } from "📚/investor/mod.ts";
import { Community, Investors } from "📚/community/mod.ts";
import { Backend } from "@sauber/journal";
import { makeTestRepository } from "../repository/mod.ts";
// import { Tick } from "📚/tick/mod.ts";
// import { DateFormat } from "📚/tick/mod.ts";

const repo: Backend = makeTestRepository();
export const community: Community = new Community(repo);
export const investors: Investors = await community.all();
export const investor: Investor = await community.any();
// export const chartStart = await community.chartStart() as DateFormat;
// export const chartStart: Tick = 0;
// export const toTick = dateToTick(chartStart);
