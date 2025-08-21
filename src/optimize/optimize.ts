import { Exchange, Simulation, Strategy } from "@sauber/backtest";
import { Maximize, Parameters, Status } from "@sauber/optimize";
import { buildStrategy } from "📚/strategy/mod.ts";
import {
  importParameters,
  makeParameters,
  ParameterData,
  ParameterValues,
} from "./parameters.ts";
import { Rater, StrategyParameters } from "📚/strategy/mod.ts";
import { Iteration } from "@sauber/ml-cli-dashboard";
import { createTimer } from "📚/signal/mod.ts";
import { score as calculateScore } from "../simulation/mod.ts";

// ANSI escape codes
const ESC = "\u001B[";
const LINEUP = "F";

type Samples = Array<{ input: Parameters; output: number }>;
type Score = number;

/** Generate and train parameters for strategy */
export class Optimize {
  constructor(
    private readonly parameters: Parameters,
    private readonly ranker: Rater,
  ) {}

  /** Generate model from saved parameters */
  public static import(data: ParameterData, ranker: Rater): Optimize {
    const parameters: Parameters = importParameters(data);
    return new Optimize(parameters, ranker);
  }

  /** Export parameters of model */
  public export(): ParameterData {
    return Object.fromEntries(
      this.parameters.map((p) => [p.name, p.value]),
    ) as ParameterData;
  }

  /** Create an optimer with random start values, run simulation and return simulation score */
  private static sample(exchange: Exchange, ranker: Rater): [Score, Optimize] {
    const input: Parameters = makeParameters();
    const optimizer = new Optimize(input, ranker);
    const score: Score = optimizer.simulation(exchange, input);
    return [score, optimizer];
  }

  /** Run a number of simulations and pick highest scoring */
  public static generate(
    exchange: Exchange,
    count: number,
    ranker: Rater,
  ): Optimize {
    console.log(`Searching for best starting point from ${count} samples...`);
    console.log("");
    const progress: Iteration = new Iteration(count, 78);
    let best: [Score, Optimize] = Optimize.sample(exchange, ranker);
    for (let i = 1; i < count; i++) {
      const result: [Score, Optimize] = Optimize.sample(exchange, ranker);
      if (result[0] > best[0]) best = result;
      console.log(ESC + LINEUP + progress.render(i + 1));
    }
    return best[1];
  }

  /** Create a strategy based on parameters */
  private strategy(parameter: Parameters): Strategy {
    const settings = Object.fromEntries(
      parameter.map((p) => [p.name, p.value]),
    ) as StrategyParameters;
    const timer: Rater = createTimer(settings);
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
      this.simulation(exchange, makeParameters(input));

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
  public predict(exchange: Exchange): Score {
    return this.simulation(exchange, this.parameters);
  }
}
