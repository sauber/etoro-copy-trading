import { Bar, Buffer, Chart, Instrument } from "@sauber/backtest";
import { Assets } from "📚/assets/assets.ts";
import { Investor } from "📚/investor/mod.ts";
import { detrendExponential } from "../timing/untrend.ts";
import { Timing } from "../timing/mod.ts";
import { Loader } from "📚/trading/loader.ts";
import { makeRanker, makeTimer, Rater } from "📚/trading/raters.ts";

// Display information about an investor

const path: string = Deno.args[0];
if (!Deno.statSync(path)) throw new Error(`Directory ${path} not found`);
const repo = Assets.disk(path);

const username: string = Deno.args[1];
const investor: Investor = await repo.community.investor(username);

// Display basic information about the investor
console.log("Investor:", investor.UserName);
console.log("Name:", investor.FullName || "N/A");
console.log("Customer ID:", investor.CustomerID || "N/A");

// Display chart
const chart: Chart = investor.chart;
console.log("Chart:");
console.log(chart.plot());

// Display chart without trend
const flattened = new Chart(detrendExponential(chart.values));
console.log("Detrended chart:");
console.log(flattened.plot());

// Display buy/sell signal strength
console.log("Signal (<0=sell, >0=buy):");
const loader: Loader = new Loader(repo);
const timing: Timing = await loader.timingModel();
const timer: Rater = makeTimer(timing);
const instrument: Instrument = await loader.instrument(username);
const start: Bar = chart.start;
const end: Bar = chart.end;
const signals: Array<number> = [];
for (let bar: Bar = start; bar >= end; bar--) {
  signals.push(timer(instrument, bar));
}
const signalbuffer: Buffer = Float32Array.from(signals);
const signalchart: Chart = new Chart(signalbuffer, end);
console.log(signalchart.plot());
