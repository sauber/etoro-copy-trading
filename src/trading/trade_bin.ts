import { Table } from "@cliffy/table";
import { DataFrame } from "@sauber/dataframe";
import { loadTimer, Rater } from "📚/strategy/mod.ts";
import { loadRanker } from "📚/ranking/mod.ts";
import { makeRepository } from "📚/repository/mod.ts";
import { Context, ParameterData } from "./context.ts";
import { DateFormat, Tick, Timeline } from "📚/tick/mod.ts";
import { Amount, Instrument, Portfolio } from "@sauber/backtest";
import { candidates } from "📚/strategy/candidates.ts";

const start: number = performance.now();

// Repo
const path: string = Deno.args[0];
const repo = makeRepository(path);
let loader: Context | null = new Context(repo);
const tick: Tick = await loader.tradingTick();

const ticks_required = path.match(/testdata/) ? 15 : 180;

// Models
const ranking: Rater = await loadRanker(repo, ticks_required);
const timing: Rater = await loadTimer(repo);

// Settings
const settings: ParameterData = await loader.settings();
const tradingTick: Tick = await loader.tradingTick();
const timeline: Timeline = await loader.timeline();
const tradingDate: DateFormat = timeline.date(tradingTick);
const username: string = await loader.username();
const instruments: Instrument[] = await loader.tradingInstruments();
const value: Amount = await loader.value();
const portfolio: Portfolio = await loader.portfolio();

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
  ["Account", username, "Position Size", settings.position_size],
  [
    "Trading Day",
    weekday[settings.weekday],
    "Trading Date",
    tradingDate + ` (tick ${tradingTick})`,
  ],
  ["Stoploss", settings.stoploss, "Limit", settings.limit],
  ["Amount", money(value), "Cash", "TBD"],
);
table.render();

const investors = candidates({
  instruments,
  positions: portfolio.positions,
  ranking,
  timing,
  tick,
  target: value * settings.position_size,
  stoploss: settings.stoploss,
});

const pct = (amount: number): number =>
  parseFloat((100 * amount).toPrecision(3));

const records = investors.map((i) => ({
  Name: i.instrument.symbol,
  Ranking: parseFloat(ranking(i.instrument, tick).toPrecision(2)),
  Timing: parseFloat(i.timing.toPrecision(2)),
  Action: i.action,
  Invested: i.invested > 0 ? money(i.invested) : undefined,
  Value: i.invested > 0 ? money(i.value) : undefined,
  "Gain%": i.invested > 0 ? pct(i.gain) : undefined,
  Buy: i.isBuy ? money(i.buy) : undefined,
}));

const df: DataFrame = DataFrame.fromRecords(records);
df.select((r) => r.Action !== "Skip").sort("Timing", false)
  .sort("Value").sort("Buy", false).print("Candidates");
