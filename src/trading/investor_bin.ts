import { Bar, Series, Instrument } from "@sauber/backtest";
import { Assets } from "📚/assets/assets.ts";
import { Investor } from "📚/investor/mod.ts";
import { detrendExponential } from "../timing/untrend.ts";
import { loadTimer } from "../timing/mod.ts";
import { Rater } from "📚/trading/raters.ts";
import { ParameterData } from "./parameters.ts";
import { EMA } from "@debut/indicators";
import { Config } from "../config/mod.ts";
import { Community } from "../community/mod.ts";

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
console.log("Simulation chart:");
console.log(investor.plot());

// Display chart without trend
const flattened = new Instrument(detrendExponential(investor.series));
console.log("Detrended chart:");
console.log(flattened.plot());

// Display chart with EMA filter applied
// const loader: Loader | null = new Loader(repo);
const config = new Config(repo.repo);
const settings: ParameterData =
        (await config.get("trading")) as ParameterData;
        
const emaPeriod: number = settings.smoothing;
const ema = new EMA(emaPeriod);
const ema_series: Series = investor.series.map((v: number) => ema.nextValue(v))
  .filter(
    (v: number) => v !== undefined && !isNaN(v),
  );
const ema_chart: Instrument = new Instrument(ema_series, investor.end);
console.log(`Chart with EMA(${emaPeriod}) smoothing applied:`);
console.log(ema_chart.plot());

// Display buy/sell signal strength
console.log("Signal (>0=sell, <0=buy):");
// const timing: Timing = await loader.timingModel();
const timer: Rater = await loadTimer(repo.repo);
// console.log(timing);
const community: Community = new Community(repo.repo);
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
