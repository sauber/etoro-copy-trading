import { Parameters } from "@sauber/optimize";
import {
  makeParameters as makeSignalParameters,
  Parameters as SignalParameters,
} from "../signal/mod.ts";
import {
  makeParameters as makeStrategyParameters,
  Parameters as StrategyParameters,
} from "./strategy.ts";

export type ParameterData = Record<string, number>;

export type ParameterValues = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** Generate list of parameters optionally with initial values */
export function makeParameters(value: ParameterValues | [] = []): Parameters {
  const strategyvalues = value.slice(0, 4) as [number, number, number, number];
  const signalvalues = value.slice(4) as [number, number, number, number];
  const signal: SignalParameters = makeSignalParameters(...signalvalues);
  const strategy: StrategyParameters = makeStrategyParameters(
    ...strategyvalues,
  );
  return [...strategy, ...signal];
}

/** Generate list of parameters from dict of initial values */
export function importParameters(values: Record<string, number>): Parameters {
  const p = makeParameters();
  p.forEach((param) => {
    const value = values[param.name];
    if (value === undefined) {
      throw new Error(`Missing parameter ${param.name}`);
    }
    param.set(value);
  });
  return p;
}
