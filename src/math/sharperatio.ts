import { Series, Price } from "@sauber/backtest";

/** Add all numbers together */
const sum = (series: Series): number =>
  series.reduce((total: number, a: number) => total + a, 0);

/** Standard Deviation */
function std(series: Series): number {
  const mean: number = sum(series) / series.length;
  const variances: Series = series.map((x) => x - mean);
  const sq: Series = variances.map((x) => x * x);
  const total: number = sum(sq);
  const result: number = Math.sqrt(total / series.length);
  return result;
}

/** Value as ratio above previous value */
function returns(series: Series): Series {
  const returns: Series = series.map((
    a,
    i,
  ) => (i == 0 ? 0 : a / series[i - 1] - 1)).slice(1);
  return returns;
}

/** Annual Yield */
function annual_return(series: Series): number {
  const years: number = (series.length - 1) / 365;
  const first: Price = series[0];
  const last: Price = series[series.length - 1];
  const annual_return = (last / first) ** (1 / years) - 1;
  return annual_return;
}

/** Annual Standard Deviation */
function annual_standard_deviation(series: Series): number {
  return std(returns(series)) * Math.sqrt(365);
}

/** Sharpe Ratio, riskfree is annual riskfree return, for example 0.05 (5%) */
export function sharpe_ratio(series: Series, riskfree: number = 0.0): number {
  return (annual_return(series) - riskfree) / annual_standard_deviation(series);
}
