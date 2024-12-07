import { Strategy, StrategyContext } from "@sauber/backtest";
import { Assets } from "📚/backend/assets.ts";
import { NullStrategy } from "📚/timing/testdata.ts";

// Repo
const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo= new Assets(path);

// Positions
const me = await repo.community.investor("sauber");
const positions = me.mirrors.last.map(m=>({m}));

const situation: StrategyContext = {
  bar: 0,
  value: 100,
  amount: 100,
  instruments: [],
  positions:[]
}

const strategy : Strategy = new NullStrategy();
