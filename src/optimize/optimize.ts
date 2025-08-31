import { Exchange, Simulation, Strategy } from "@sauber/backtest";
import { Maximize, Status } from "@sauber/optimize";

import { buildStrategy, createTimer, Rater } from "📚/strategy/mod.ts";
import { score as calculateScore } from "📚/simulation/mod.ts";
import { limits, Settings } from "📚/signal/mod.ts";

import { Parameters, type ParameterValues } from "./parameters.ts";

// import {
//   importParameters,
//   makeParameters,
//   makeRandomParameters,
//   ParameterData,
//   ParameterValues,
// } from "./loader.ts";

type Score = number;

/** Generate and train parameters for strategy by running simulation */
export class Optimize {
  constructor(
    public readonly parameters: Parameters,
    private readonly ranker: Rater,
  ) {}

  /** Generate model from saved parameters */
  // public static import(data: ParameterData, ranker: Rater): Optimize {
  //   const parameters: Parameters = importParameters(data);
  //   return new Optimize(parameters, ranker);
  // }

  /** Export parameters of model */
  // public export(): ParameterData {
  //   return Object.fromEntries(
  //     this.parameters.map((p) => [p.name, p.value]),
  //   ) as ParameterData;
  // }

  /** Create an optimer with random start values, run simulation and return simulation score */
  private sample(exchange: Exchange, ranker: Rater): [Score, Parameters] {
    const input = this.parameters.random();
    const optimizer = new Optimize(input, ranker);
    const score: Score = optimizer.simulation(exchange, input);
    return [score, input];
  }

  /** Run a number of simulations and pick highest scoring */
  public generate(
    exchange: Exchange,
    count: number,
    ranker: Rater,
    status: Status = () => undefined,
  ): Optimize {
    const history: number[] = [];

    let best: [Score, Parameters] = this.sample(exchange, ranker);
    history.push(best[0]);
    for (let i = 1; i < count; i++) {
      const result: [Score, Parameters] = this.sample(exchange, ranker);
      if (result[0] > best[0]) best = result;
      history.push(best[0]);
      status(i + 1, 0, best[1].all(), history);
    }
    return new Optimize(best[1], ranker);
  }

  /** Create a strategy based on parameters */
  private strategy(parameter: Parameters): Strategy {
    const settings = Object.fromEntries(
      this.parameters.all().map((p) => [p.name, p.value]),
    );

    const timerKeys: string[] = Object.keys(limits);
    const timerSettings: Settings = Object.fromEntries(
      timerKeys.map((key) => [key, settings[key]]),
    );

    const timer: Rater = createTimer(timerSettings);
    return buildStrategy(settings, this.ranker, timer);
  }

  /** Run simulation from input parameters and return score */
  private simulation(
    exchange: Exchange,
    parameter: Parameters,
  ): Score {
    const strategy: Strategy = this.strategy(parameter);
    const simulation = new Simulation(exchange, strategy);
    simulation.run();
    return calculateScore(simulation);
  }

  /** Train model */
  public optimize(
    exchange: Exchange,
    epochs: number = 500,
    epsilon: number = 0.01,
    status: Status = () => undefined,
  ): number {
    // Callback from optimize to model
    const agent = (input: ParameterValues): Score =>
      // this.simulation(exchange, makeParameters(input));
    this.simulation(exchange, this.parameters.random().set(input));


    // Configure maximizer
    const minimizer = new Maximize({
      parameters: this.parameters.all(),
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
  public predict(exchange: Exchange): Score {
    return this.simulation(exchange, this.parameters);
  }
}
