import { Table } from "@cliffy/table";
import { DataFrame } from "@sauber/dataframe";
import { Amount, Instrument, Portfolio } from "@sauber/backtest";

import { Candidate, candidates, loadTimer, Rater } from "📚/strategy/mod.ts";
import { loadRanker } from "📚/ranking/mod.ts";
import { makeRepository } from "📚/repository/mod.ts";
import { DateFormat, Tick, Timeline } from "📚/tick/mod.ts";
import { Community } from "📚/community/mod.ts";
import { Instruments } from "📚/trading/instruments.ts";
import { Account } from "📚/account/mod.ts";
import { Investor } from "📚/investor/mod.ts";

import { Settings, settings } from "./settings.ts";
import { loadPortfolio } from "./portfolio.ts";
import { tradingTick } from "./tradingday.ts";

const start: number = performance.now();

// Repo
const path: string = Deno.args[0];
const repo = makeRepository(path);

// TODO: Should only be needed when training
const ticks_required = path.match(/testdata/) ? 15 : 180;

// Models
const ranking: Rater = await loadRanker(repo, ticks_required);
const timing: Rater = await loadTimer(repo);

// Settings
const config: Settings = await settings(repo);

// Account
const account = new Account(repo);
const value: Amount = await account.value();
const username: string = await account.username();

// Community
const community = new Community(repo);
const tick: Tick = await tradingTick(community, config.weekday);
let loader: Instruments | null = new Instruments(repo, tick);
const instruments: Instrument[] = await loader.tradingInstruments();
const timeline: Timeline = await community.timeline();
const tradingDate: DateFormat = timeline.date(tick);

// Portfolio
const investor: Investor = await loader.investor(username);
const portfolio: Portfolio = await loadPortfolio(
  investor,
  tick,
  value,
  loader,
);

// Loading finished, free cache memory
loader = null;

const money = (amount: Amount): number => parseFloat(amount.toFixed(2));

// Print settings
const snap: number = performance.now();
const weekday = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const table: Table = new Table(
  [
    "Loading",
    Math.round(snap - start) + " ms",
    "Investors",
    instruments.length,
  ],
  ["Account", username, "Position Size", config.position_size],
  [
    "Trading Day",
    weekday[config.weekday],
    "Trading Date",
    tradingDate + ` (tick ${tick})`,
  ],
  ["Stoploss", config.stoploss, "Limit", config.limit],
  ["Amount", money(value), "Cash", "TBD"],
);
table.render();

const investors = candidates({
  instruments,
  positions: portfolio.positions,
  ranking,
  timing,
  tick,
  target: value * config.position_size,
  stoploss: config.stoploss,
});

const pct = (amount: number): number =>
  parseFloat((100 * amount).toPrecision(3));

const records = investors.map((i: Candidate) => ({
  Name: i.instrument.symbol,
  Ranking: parseFloat(ranking(i.instrument, tick).toPrecision(2)),
  Invested: i.invested > 0 ? money(i.invested) : undefined,
  Days: i.ticksSinceOpen,
  Value: i.invested > 0 ? money(i.value) : undefined,
  "Gain%": i.invested > 0 ? pct(i.gain) : undefined,
  Timing: parseFloat(i.timing.toPrecision(2)),
  Action: i.action,
  Buy: i.isBuy ? money(i.buy) : undefined,
}));

const df: DataFrame = DataFrame.fromRecords(records);
df.select((r) => r.Action !== "Skip").sort("Timing", false)
  .sort("Value").sort("Buy", false).print("Candidates");
