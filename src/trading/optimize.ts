import {
  Bar,
  Exchange,
  Instrument,
  Simulation,
  Strategy,
} from "@sauber/backtest";
import { Maximize, Parameters } from "📚/optimize/mod.ts";
import { CascadeStrategy, RoundingStrategy } from "📚/strategy/mod.ts";
import { WeekdayStrategy } from "📚/timing/weekday-strategy.ts";
import { Status } from "📚/optimize/types.d.ts";
import { FutureStrategy } from "📚/strategy/future-strategy.ts";
import { Policy } from "📚/trading/policy.ts";

// function makeParameters(value: Array<number> = []): Parameters {
//   return [
//     new IntegerParameter("window", 2, 100, value[0]),
//     new IntegerParameter("buy", 10, 40, value[1]),
//     new IntegerParameter("sell", 60, 90, value[2]),
//     new IntegerParameter("weekday", 1, 1, value[3]),
//     new Parameter("size", 0.01, 0.05, value[4]),
//   ];
// }
import {
  Bar,
  Exchange,
  Instrument,
  Simulation,
  Strategy,
} from "@sauber/backtest";
import { Maximize, Parameters } from "📚/optimize/mod.ts";
import { CascadeStrategy, RoundingStrategy } from "📚/strategy/mod.ts";
import { WeekdayStrategy } from "📚/timing/weekday-strategy.ts";
import { Status } from "📚/optimize/types.d.ts";
import { FutureStrategy } from "📚/strategy/future-strategy.ts";
import { Policy } from "📚/trading/policy.ts";

// function makeParameters(value: Array<number> = []): Parameters {
//   return [
//     new IntegerParameter("window", 2, 100, value[0]),
//     new IntegerParameter("buy", 10, 40, value[1]),
//     new IntegerParameter("sell", 60, 90, value[2]),
//     new IntegerParameter("weekday", 1, 1, value[3]),
//     new Parameter("size", 0.01, 0.05, value[4]),
//   ];
// }

// Values of window, buy, sell, weekday
// type ParameterValues = [number, number, number, number, number];
type Score = number;
import { makeParameters, ParameterValues } from "📚/trading/parameters.ts";
import { makeTimer, Rater } from "📚/trading/raters.ts";
import { ParameterData } from "📚/trading/mod.ts";
import { Timing } from "📚/timing/timing.ts";
// export type TradingData = {
//   window: number;
//   buy: number;
//   sell: number;
//   weekday: number;
//   size: number;
// };
// type ParameterValues = [number, number, number, number, number];
type Score = number;
import { makeParameters, ParameterValues } from "📚/trading/parameters.ts";
import { makeTimer, Rater } from "📚/trading/raters.ts";
import { ParameterData } from "📚/trading/mod.ts";
import { Timing } from "📚/timing/timing.ts";
// export type TradingData = {
//   window: number;
//   buy: number;
//   sell: number;
//   weekday: number;
//   size: number;
// };

type Samples = Array<{ input: Parameters; output: number }>;

/** Generate and train parameters for timing model */
export class Optimize {
  constructor(
    private readonly parameters: Parameters,
    private readonly ranker: Rater,
  ) {}
  constructor(
    private readonly parameters: Parameters,
    private readonly ranker: Rater,
  ) {}

  /** Generate model from saved parameters */
  public static import(data: ParameterData, ranker: Rater): Optimize {
    const values: ParameterValues = [
      data.weekday,
      data.buy_window,
      data.buy_threshold,
      data.sell_window,
      data.sell_threshold,
      data.position_size,
    ];
    const parameters: Parameters = makeParameters(values);
    return new Optimize(parameters, ranker);
  public static import(data: ParameterData, ranker: Rater): Optimize {
    const values: ParameterValues = [
      data.weekday,
      data.buy_window,
      data.buy_threshold,
      data.sell_window,
      data.sell_threshold,
      data.position_size,
    ];
    const parameters: Parameters = makeParameters(values);
    return new Optimize(parameters, ranker);
  }

  /** Export parameters of model */
  public export(): ParameterData {
  public export(): ParameterData {
    return Object.fromEntries(
      this.parameters.map((p) => [p.name, p.value]),
    ) as ParameterData;
    ) as ParameterData;
  }

  /** Create an optimer with random start values */
  private static random(ranker: Rater): Optimize {
    return new Optimize(makeParameters(), ranker);
  }

  /** Create an optimer with random start values, run simulation and return simulation score */
  private static sample(exchange: Exchange, ranker: Rater): [Score, Optimize] {
    const input: Parameters = makeParameters();
    // console.log({input});
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
    let best: [Score, Optimize] = Optimize.sample(exchange, ranker);
    for (let i = 1; i < count; i++) {
      const result: [Score, Optimize] = Optimize.sample(exchange, ranker);
      if (result[0] > best[0]) best = result;
    }
    // console.log(best);
    return best[1];
  /** Create an optimer with random start values */
  private static random(ranker: Rater): Optimize {
    return new Optimize(makeParameters(), ranker);
  }

  /** Create an optimer with random start values, run simulation and return simulation score */
  private static sample(exchange: Exchange, ranker: Rater): [Score, Optimize] {
    const input: Parameters = makeParameters();
    // console.log({input});
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
    let best: [Score, Optimize] = Optimize.sample(exchange, ranker);
    for (let i = 1; i < count; i++) {
      const result: [Score, Optimize] = Optimize.sample(exchange, ranker);
      if (result[0] > best[0]) best = result;
    }
    // console.log(best);
    return best[1];
  }

  /** Get results for a number of inputs */
  private samples(exchange: Exchange, count: number): Samples {
    const result: Samples = Array(count);
    for (let i = 0; i < count; i++) {
      const input: Parameters = makeParameters();
      const output: number = this.simulation(exchange, input);
      result[i] = { input, output };
    }
    return result;
  }

  /** Dump parameters and score */
  private print(exchange: Exchange): string {
    const v = (n: number): string => n.toFixed(4);
    const score = this.simulation(exchange, this.parameters);
    return `Score: ${v(score)} ` +
      this.parameters.map((p) => p.print()).join(", ");
  }

  /** Calculate score of simulation */
  // TODO: Factor in some sort of stability measure
  private score(simulation: Simulation): number {
    // console.log("Calculating Score of Simultion");
    // console.log({simulation});
    const trades: number = simulation.account.trades.length;
    if (trades == 0) return 0;
    const profit: number = simulation.account.profit;
    // const invested: number = simulation.account.InvestedRatio;
    // const invested: number = simulation.account.InvestedRatio;
    const win: number = simulation.account.WinRatio;
    const frag: number = simulation.account.fragility;
    const frag: number = simulation.account.fragility;

    // Normalize costs: 0=no cost, 1=worst cost
    // The more trades the worse
    const trades_cost: number = Math.tanh(
      trades / simulation.account.bars,
    );
    // The more uninvested cash invested the worse
    // const cash_cost = 1 - invested;
    // const cash_cost = 1 - invested;
    // The more losses the worse
    const lose_cost = 1 - win;

    // Favor more closes than expirations
    const expire = simulation.account.expireRatio;


    // Favor more closes than expirations
    const expire = simulation.account.expireRatio;

    // Scale each cost to profit
    const scale: number = Math.abs(profit);
    const costs = scale * (trades_cost + lose_cost + frag + expire) / 4;
    const scale: number = Math.abs(profit);
    const costs = scale * (trades_cost + lose_cost + frag + expire) / 4;
    // Subtract cost from profit;
    const score = profit - costs;
    if (!isFinite(score)) {
      console.log({
        trades,
        profit,
        win,
        frag,
        trades_cost,
        lose_cost,
        expire,
        scale,
        costs,
        score,
      });
      throw new Error("Score is invalid");
    }

    return score;
  }

  /** Create a strategy based on parameters */
  private strategy(parameter: Parameters): Strategy {
    const settings = Object.fromEntries(
      parameter.map((p) => [p.name, p.value]),
    );
    const timingModel: Timing = new Timing(
      settings.buy_window,
      settings.buy_threshold,
      settings.sell_window,
      settings.sell_threshold,
    );
    const timer: Rater = makeTimer(timingModel);
    const policy = new Policy(this.ranker, timer, settings.position_size);

    const strategy: Strategy = new CascadeStrategy([
      new WeekdayStrategy(settings.weekday),
      new FutureStrategy(180),
      policy,
      new RoundingStrategy(200),
    ]);
    return strategy;
  }

  /** Run simulation from input parameters and return score */
  private simulation(
    exchange: Exchange,
    parameter: Parameters,
  ): Score {
    const strategy: Strategy = this.strategy(parameter);
    const simulation = new Simulation(exchange, strategy);
    simulation.run();
    return this.score(simulation);
  }

  /** Create a strategy based on parameters */
  private strategy(parameter: Parameters): Strategy {
    const settings = Object.fromEntries(
      parameter.map((p) => [p.name, p.value]),
    );
    const timingModel: Timing = new Timing(
      settings.buy_window,
      settings.buy_threshold,
      settings.sell_window,
      settings.sell_threshold,
    );
    const timer: Rater = makeTimer(timingModel);
    const policy = new Policy(this.ranker, timer, settings.position_size);

    const strategy: Strategy = new CascadeStrategy([
      new WeekdayStrategy(settings.weekday),
      new FutureStrategy(180),
      policy,
      new RoundingStrategy(200),
    ]);
    return strategy;
  }

  /** Run simulation from input parameters and return score */
  private simulation(
    exchange: Exchange,
    parameter: Parameters,
  ): Score {
    const strategy: Strategy = this.strategy(parameter);
    const simulation = new Simulation(exchange, strategy);
    simulation.run();
    return this.score(simulation);
  }

  /** Train model */
  public optimize(
    exchange: Exchange,
    epochs: number = 500,
    epsilon: number = 0.001,
    status: Status = () => undefined,
    status: Status = () => undefined,
  ): number {
    // Callback from optimize to model
    const reward = (input: ParameterValues): Score => {
      const score: Score = this.simulation(exchange, makeParameters(input));
      return score;
    const reward = (input: ParameterValues): Score => {
      const score: Score = this.simulation(exchange, makeParameters(input));
      return score;
    };

    // Configure minimizer
    const minimizer = new Maximize({
    const minimizer = new Maximize({
      parameters: this.parameters,
      agent: reward as (inputs: Array<number>) => number,
      agent: reward as (inputs: Array<number>) => number,
      epochs,
      status,
      every: 10,
      epsilon,
      batchSize: 20,
    });

    const iterations = minimizer.run();
    return iterations;
  }

  public predict(exchange: Exchange): Score {
  public predict(exchange: Exchange): Score {
    return this.simulation(exchange, this.parameters);
  }
}
