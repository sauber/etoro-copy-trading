import { Bar, Instrument, Series } from "@sauber/backtest";
import { Investor } from "📚/investor/mod.ts";
import { loadTimer, Rater } from "../strategy/mod.ts";
import { Community } from "../community/mod.ts";
import { makeRepository } from "../repository/mod.ts";

// Display information about an investor

const path: string = Deno.args[0];
const repo = makeRepository(path);
const community: Community = new Community(repo);

const username: string = Deno.args[1];
const investor: Investor = await community.investor(username);

// Display basic information about the investor
console.log("Investor:", investor.UserName);
console.log("Name:", investor.FullName || "N/A");
console.log("Customer ID:", investor.CustomerID || "N/A");
console.log("Chart length:", investor.start - investor.end);

// Display chart
console.log("Simulation chart:");
console.log(investor.plot());

// Display buy/sell signal strength
console.log("Signal (>0=sell, <0=buy):");
const timer: Rater = await loadTimer(repo);
const instrument: Instrument = await community.investor(username);
const start: Bar = investor.start;
const end: Bar = investor.end;
const signals: Array<number> = [];
for (let bar: Bar = start; bar >= end; bar--) {
  signals.push(timer(instrument, bar));
}
const signalseries: Series = Float32Array.from(signals);
const signalchart = new Instrument(signalseries, end);
console.log(signalchart.plot());
