import { Series, Tick } from "@sauber/backtest";
import { linechart } from "@sauber/widgets";

import { Investor } from "📚/investor/mod.ts";
import { loadTimer, Rater } from "📚/strategy/mod.ts";
import { Community } from "📚/community/mod.ts";
import { makeRepository } from "📚/repository/mod.ts";

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
console.log(
  `Chart ticks: ${investor.series.length} [${investor.start};${investor.end}]`,
);

// Display chart
console.log("Simulation chart:");
console.log(linechart(Array.from(investor.series), 15, 72));

// Display buy/sell signal strength
console.log("Signal (>0=sell, <0=buy):");
const timer: Rater = await loadTimer(repo);
const start: Tick = investor.start;
const end: Tick = investor.end;
const signals: Array<number> = [];
for (let tick: Tick = start; tick <= end; tick++) {
  signals.push(timer(investor, tick));
}
const signalseries: Series = Float32Array.from(signals);
console.log(linechart(Array.from(signalseries), 15, 72));
