import { Exchange, Simulation, Strategy } from "@sauber/backtest";
import {
  IntegerParameter,
  Maximize,
  Parameter,
  Status,
} from "@sauber/optimize";

import {
  buildStrategy,
  createTimer,
  inputParameters,
  Rater,
} from "📚/strategy/mod.ts";
import { score as calculateScore } from "📚/simulation/mod.ts";
import { type Limits, limits } from "📚/signal/mod.ts";

// Numerical result of simulation
type Score = number;

// Key/value dict for parameters
export type Settings = Record<string, number>;

// Score of input Settings
type Result = [Score, Settings];

// A list of parameters
type Parameters = Array<Parameter>;

// Values of parameters as an array
type ParameterValues = Array<number>;

/** Convert array of keys and array of values into dict */
const zip = (keys: string[], values: number[]): Settings =>
  Object.fromEntries(keys.map((key, index) => [key, values[index]]));

/** Convert limits to list of Parameters, initialized with default values */
const makeParameters = (limits: Limits): Parameters =>
  Object.entries(limits).map(([name, limit]) =>
    (limit.int)
      ? new IntegerParameter(name, limit.min, limit.max, limit.default)
      : new Parameter(name, limit.min, limit.max, limit.default)
  );

/** Create strategy from settings and calculate score of simulation */
export class Optimize {
  // Limits from strategy and timing
  private readonly strategyLimits: Limits = inputParameters;
  private readonly timerLimits: Limits = limits;

  // Keys of strategy and timing parameters
  private readonly strategyKeys: string[] = Object.keys(this.strategyLimits);
  private readonly timerKeys: string[] = Object.keys(this.timerLimits);
  private readonly parameterKeys: string[] = [
    ...this.strategyKeys,
    ...this.timerKeys,
  ];

  // Create list of parameters
  private readonly strategyParameters: Parameters = makeParameters(
    this.strategyLimits,
  );
  private readonly timerParameters: Parameters = makeParameters(
    this.timerLimits,
  );
  public readonly parameters: Parameters = [
    ...this.strategyParameters,
    ...this.timerParameters,
  ];

  constructor(
    private readonly exchange: Exchange,
    private readonly ranker: Rater,
  ) {}

  /** Random values from parameters */
  private random(): Settings {
    return Object.fromEntries(this.parameters.map((p) => [p.name, p.random]));
  }

  /** Create an optimer with random start values, run simulation and return simulation score */
  private sample(): Result {
    const input: Settings = this.random();
    const score: Score = this.simulation(input);
    return [score, input];
  }

  /** Run a number of simulations from random settings and pick highest scoring */
  public reset(
    count: number,
    status: Status = () => undefined,
  ): Settings {
    const history: number[] = [];

    let best: Result = this.sample();
    history.push(best[0]);
    for (let i = 1; i < count; i++) {
      const result: Result = this.sample();
      if (result[0] > best[0]) best = result;
      history.push(best[0]);
      status(i + 1, 0, this.setParameterValues(best[1]), history);
    }
    return best[1];
  }

  /** Create a strategy based on parameters */
  private strategy(settings: Settings): Strategy {
    // Split settings into Strategy and Timer settings
    const strategySettings: Settings = Object.fromEntries(
      this.strategyKeys.map((key) => [key, settings[key]]),
    );
    const timerSettings: Settings = Object.fromEntries(
      this.timerKeys.map((key) => [key, settings[key]]),
    );

    const timer: Rater = createTimer(timerSettings);
    return buildStrategy(strategySettings, this.ranker, timer);
  }

  /** Run simulation from input parameters and return score */
  private simulation(
    settings: Settings,
  ): Score {
    const strategy: Strategy = this.strategy(settings);
    const simulation = new Simulation(this.exchange, strategy);
    simulation.run();
    return calculateScore(simulation);
  }

  /** Get timing parameter values */
  public getStrategySettings(): Settings {
    return Object.fromEntries(
      this.strategyParameters.map((p) => [p.name, p.value]),
    );
  }

  /** Get timing parameter values */
  public getTimerSettings(): Settings {
    return Object.fromEntries(
      this.timerParameters.map((p) => [p.name, p.value]),
    );
  }

  /** Get values from parameters */
  public getParameterValues(): Settings {
    return Object.fromEntries(this.parameters.map((p) => [p.name, p.value]));
  }

  /** Confirm all parameters are present */
  private validateParameters(settings: Settings): boolean {
    return this.parameters.every((p) => p.name in settings);
  }

  /** Set values of parameters */
  public setParameterValues(settings: Settings): Parameters {
    if (!(this.validateParameters(settings))) {
      throw new Error("Invalid settings");
    }
    this.parameters.forEach((p) => p.set(settings[p.name]));
    return this.parameters;
  }

  /** Attemp to improve parameter values for better score */
  public optimize(
    epochs: number = 500,
    epsilon: number = 0.01,
    status: Status = () => undefined,
  ): number {
    // Callback from optimize to model
    const agent = (input: ParameterValues): Score =>
      this.simulation(zip(this.parameterKeys, input));

    // Configure maximizer
    const minimizer = new Maximize({
      parameters: this.parameters,
      agent,
      epochs,
      status,
      every: 1,
      epsilon,
      batchSize: 32,
    });

    const iterations = minimizer.run();
    return iterations;
  }

  /** Predict score based on current parameters */
  public predict(): Score {
    return this.simulation(this.getParameterValues());
  }
}
