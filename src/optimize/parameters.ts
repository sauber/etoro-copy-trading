import { IntegerParameter, Parameter, Parameters } from "@sauber/optimize";
import { inputParameters as signalParameters } from "../signal/mod.ts";
import { inputParameters as strategyParameters } from "../strategy/strategy.ts";

export type ParameterData = Record<string, number>;

export type ParameterRange = {
  min: number;
  max: number;
  default: number;
  int?: boolean;
};

export type Limits = Record<string, ParameterRange>;

/** Convert a dict of Ranges into Optimizable Parameters */
function convertParameters(
  limits: Limits,
  values: Record<string, number>,
): Parameters {
  return Object.entries(limits).map(([name, limit]) =>
    (limit.int)
      ? new IntegerParameter(
        name,
        limit.min,
        limit.max,
        values[name] || limit.default,
      )
      : new Parameter(
        name,
        limit.min,
        limit.max,
        values[name] || limit.default,
      )
  );
}

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

function makeStrategyParameters(
  values: [number, number, number, number],
): Parameters {
  const keys: string[] = Object.keys(strategyParameters);
  const settings: Record<string, number> = Object.fromEntries(
    keys.map((name, index) => [name, values[index]]),
  );
  return convertParameters(strategyParameters, settings);
}

function makeSignalParameters(
  values: [number, number, number, number],
): Parameters {
    const keys: string[] = Object.keys(signalParameters);
    const settings: Record<string, number> = Object.fromEntries(
        keys.map((name, index) => [name, values[index]]),
    );
    return convertParameters(signalParameters, settings);
}

/** Generate list of parameters optionally with initial values */
export function makeParameters(value: ParameterValues | [] = []): Parameters {
  const strategyvalues = value.slice(0, 4) as [number, number, number, number];
  const signalvalues = value.slice(4) as [number, number, number, number];
  const strategy: Parameters = makeStrategyParameters(strategyvalues);
  const signal: Parameters = makeSignalParameters(signalvalues);
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