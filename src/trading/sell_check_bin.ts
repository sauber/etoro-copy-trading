import { Table } from "@cliffy/table";
import { DataFrame } from "@sauber/dataframe";

import { loadTimer, Rater } from "📚/strategy/mod.ts";
import { makeRepository } from "📚/repository/mod.ts";
import { DateFormat, Tick, Timeline } from "📚/tick/mod.ts";
import { Community } from "📚/community/mod.ts";
import { Account } from "📚/account/mod.ts";
import { Investor } from "📚/investor/mod.ts";

import { Settings, settings } from "./settings.ts";
import { loadPortfolio } from "./portfolio.ts";
import { tradingTick } from "./tradingday.ts";
import { Instruments } from "./instruments.ts";

const start: number = performance.now();

// Repo
const path: string = Deno.args[0];
const repo = makeRepository(path);

// Models
const timing: Rater = await loadTimer(repo);

// Settings
const config: Settings = await settings(repo);

// Account
const account = new Account(repo);
const value = await account.value();
const username: string = await account.username();

// Community
const community = new Community(repo);
const tick: Tick = await tradingTick(community, config.weekday);
let loader: Instruments | null = new Instruments(repo, tick);
const timeline: Timeline = await community.timeline();
const tradingDate: DateFormat = timeline.date(tick);

// Portfolio
const investor: Investor = await loader.investor(username);
const portfolio = await loadPortfolio(investor, tick, value, loader);
loader = null;

const money = (amount: number): number => parseFloat(amount.toFixed(2));

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
    "Positions",
    portfolio.positions.length,
  ],
  ["Account", username, "Trading Date", tradingDate + ` (tick ${tick})`],
  [
    "Trading Day",
    weekday[config.weekday],
    "Sell Signal",
    "> 0 on trading weekday",
  ],
  ["Position Value", money(value), "Cash", "TBD"],
);
table.render();

const startWeekday = timeline.weekday(0);
const sells = portfolio.positions.flatMap((position) => {
  const latestTick = Math.min(tick, position.instrument.end);
  const latestGain = (
    position.value(latestTick) - position.invested
  ) / position.invested;
  const latestGainPct = Number.isFinite(latestGain)
    ? parseFloat((100 * latestGain).toPrecision(3))
    : 0;

  const hits: Array<{
    Symbol: string;
    Date: DateFormat;
    Reason: "Take" | "Trail";
    Days: number;
    GainAtDatePct: number;
    GainLatestPct: number;
  }> = [];

  for (let t = position.start; t <= tick; t++) {
    const isTradingDay = (startWeekday + t) % 7 === config.weekday;
    if (!isTradingDay) continue;

    if (!position.instrument.has(t)) continue;

    const signal = timing(position.instrument, t);

    const price = position.instrument.price(t);
    const maxSinceOpen = Math.max(
      ...position.instrument.slice(position.start, t).series,
    );
    const drawdown = maxSinceOpen > 0 ? 1 - (price / maxSinceOpen) : 0;
    const trail = drawdown > 0 && (1 - drawdown) < config.stoploss;

    const reason: "Take" | "Trail" | null = trail
      ? "Trail"
      : signal > 0
      ? "Take"
      : null;

    if (!reason) continue;

    const gainAtDate = (
      position.value(t) - position.invested
    ) / position.invested;
    const gainAtDatePct = Number.isFinite(gainAtDate)
      ? parseFloat((100 * gainAtDate).toPrecision(3))
      : 0;

    hits.push({
      Symbol: position.instrument.symbol,
      Date: timeline.date(t),
      Reason: reason,
      Days: t - position.start,
      GainAtDatePct: gainAtDatePct,
      GainLatestPct: latestGainPct,
    });
  }

  return hits;
});

if (sells.length === 0) {
  console.log("No sell opportunities found for held positions.");
  Deno.exit(0);
}

const df = DataFrame.fromRecords(sells);
df.sort("Date", false).print("Sell opportunities for held positions");
