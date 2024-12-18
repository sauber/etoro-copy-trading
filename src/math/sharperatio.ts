import { Buffer, Price } from "@sauber/backtest";

/** Add all numbers together */
const sum = (buffer: Buffer): number =>
  buffer.reduce((total: number, a: number) => total + a, 0);

/** Standard Deviation */
function std(buffer: Buffer): number {
  const mean: number = sum(buffer) / buffer.length;
  const variances: Buffer = buffer.map((x) => x - mean);
  const sq: Buffer = variances.map((x) => x * x);
  const total: number = sum(sq);
  const result: number = Math.sqrt(total / buffer.length);
  return result;
}

/** Value as ratio above previous value */
function returns(buffer: Buffer): Buffer {
  const returns: Buffer = buffer.map((
    a,
    i,
  ) => (i == 0 ? 0 : a / buffer[i - 1] - 1)).slice(1);
  return returns;
}

/** Annual Yield */
function annual_return(buffer: Buffer): number {
  const years: number = (buffer.length - 1) / 365;
  const first: Price = buffer[0];
  const last: Price = buffer[buffer.length - 1];
  const annual_return = (last / first) ** (1 / years) - 1;
  return annual_return;
}

/** Annual Standard Deviation */
function annual_standard_deviation(buffer: Buffer): number {
  return std(returns(buffer)) * Math.sqrt(365);
}

/** Sharpe Ratio, riskfree is annual riskfree return, for example 0.05 (5%) */
export function sharpe_ratio(buffer: Buffer, riskfree: number = 0.0): number {
  return (annual_return(buffer) - riskfree) / annual_standard_deviation(buffer);
}
