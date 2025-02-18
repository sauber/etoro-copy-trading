import { Assets } from "📚/assets/mod.ts";
import { path } from "📚/assets/testdata.ts";

export const assets = Assets.disk(path);
export const investor = await assets.community.any();
export const ranking = assets.ranking;
await ranking.load();
