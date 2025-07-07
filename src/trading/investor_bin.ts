import { Bar, Buffer, Chart, Instrument } from "@sauber/backtest";
import { Assets } from "📚/assets/assets.ts";
import { Investor } from "📚/investor/mod.ts";
import { detrendExponential } from "../timing/untrend.ts";
import { Timing } from "../timing/mod.ts";
import { Loader } from "📚/trading/loader.ts";
import { makeTimer, Rater } from "📚/trading/raters.ts";
import { ParameterData } from "./parameters.ts";
import { EMA } from "@debut/indicators";

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
console.log("Simulation chart:");
console.log(chart.plot());

// Display chart without trend
const flattened = new Chart(detrendExponential(chart.values));
console.log("Detrended chart:");
console.log(flattened.plot());

// Display chart with EMA filter applied
const loader: Loader | null = new Loader(repo);
const settings: ParameterData = await loader.settings();
const emaPeriod: number = settings.smoothing;
const ema = new EMA(emaPeriod);
const ema_series: Buffer = chart.values.map((v: number) => ema.nextValue(v))
  .filter(
    (v: number) => v !== undefined && !isNaN(v),
  );
const ema_chart: Chart = new Chart(ema_series, chart.end);
// console.log(`Smoothing with EMA(${emaPeriod}). Orignal length: ${chart.values.length}. New length: ${ema_chart.values.length}`);
console.log(`Chart with EMA(${emaPeriod}) smoothing applied:`);
console.log(ema_chart.plot());

// Display buy/sell signal strength
console.log("Signal (<0=sell, >0=buy):");
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
