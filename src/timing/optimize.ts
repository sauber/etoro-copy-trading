import { Exchange, Simulation, Strategy } from "@sauber/backtest";
import {
  IntegerParameter,
  Maximize,
  Parameter,
  Parameters,
  StaticParameter,
} from "📚/optimize/mod.ts";
import { CascadeStrategy, SizingStrategy } from "📚/strategy/mod.ts";
import { RSIStrategy } from "📚/timing/rsi-strategy.ts";
import { WeekdayStrategy } from "📚/timing/weekday-strategy.ts";
import { Status } from "📚/optimize/types.d.ts";
import { DelayStrategy } from "📚/timing/mod.ts";
import { FutureStrategy } from "📚/strategy/future-strategy.ts";

function makeParameters(value: Array<number> = []): Parameters {
  return [
    new IntegerParameter("window", 2, 100, value[0]),
    new IntegerParameter("buy", 10, 40, value[1]),
    new IntegerParameter("sell", 60, 90, value[2]),
    new StaticParameter("weekday", value[3]),
    new Parameter("size", 0.01, 0.05, value[4]),
  ];
}

// Values of window, buy, sell, weekday
type Input = [number, number, number, number, number];
type Output = number;
export type TradingData = {
  window: number;
  buy: number;
  sell: number;
  weekday: number;
  size: number;
};

type Samples = Array<{ input: Parameters; output: number }>;

/** Generate and train parameters for timing model */
export class Optimize {
  constructor(private readonly parameters: Parameters = makeParameters()) {}

  /** Generate model from saved parameters */
  public static import(data: TradingData): Optimize {
    const names = makeParameters()
      .map((p) => p.name) as Array<keyof TradingData>;
    const values = names.map((name) => data[name]) as Input;
    return new Optimize(makeParameters(values));
  }

  /** Export parameters of model */
  public export(): TradingData {
    return Object.fromEntries(
      this.parameters.map((p) => [p.name, p.value]),
    ) as TradingData;
  }

  /** Scan a number of random points, and pick best */
  public static best(count: number, exchange: Exchange): Optimize {
    // Find starting point
    const sampler = new Optimize();
    const samples: Samples = sampler.samples(exchange, count);
    samples.sort((a, b) => b.output - a.output);
    const start = samples[0];
    return new Optimize(start.input);
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
    const trades: number = simulation.account.trades.length;
    const profit: number = simulation.account.profit;
    // const invested: number = simulation.account.InvestedRatio;
    const win: number = simulation.account.WinRatio;
    const frag: number = simulation.account.fragility;

    // Normalize costs: 0=no cost, 1=worst cost
    // The more trades the worse
    const trades_cost: number = Math.tanh(
      trades / simulation.account.bars,
    );
    // The more uninvested cash invested the worse
    // const cash_cost = 1 - invested;
    // The more losses the worse
    const lose_cost = 1 - win;

    // Favor more closes than expirations
    const expire = simulation.account.expireRatio;

    // Scale each cost to profit
    const scale: number = Math.abs(profit);
    const costs = scale * (trades_cost + lose_cost + frag + expire) / 4;
    // Subtract cost from profit;
    const score = profit - costs;

    return score;
  }

  /** Run simulation from input parameters and calculate score */
  private simulation(
    exchange: Exchange,
    parameter: Parameters,
  ): Output {
    // Configure a simulation using input parameters
    const settings = Object.fromEntries(
      parameter.map((p) => [p.name, p.value]),
    );
    const strategy: Strategy = new CascadeStrategy([
      new WeekdayStrategy(settings.weekday),
      new FutureStrategy(180),
      new DelayStrategy(
        2,
        new RSIStrategy(settings.window, settings.buy, settings.sell),
      ),
      new SizingStrategy(settings.size),
    ]);
    const simulation = new Simulation(exchange, strategy);

    // Run simulation
    simulation.run();

    // Extract score
    return this.score(simulation);
  }

  /** Train model */
  public optimize(
    exchange: Exchange,
    epochs: number = 500,
    epsilon: number = 0.001,
    status: Status = () => undefined,
  ): number {
    // Callback from optimize to model
    const reward = (input: Input): Output => {
      const score: Output = this.simulation(exchange, makeParameters(input));
      return score;
    };

    // Configure minimizer
    const minimizer = new Maximize({
      parameters: this.parameters,
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

  public predict(exchange: Exchange): Output {
    return this.simulation(exchange, this.parameters);
  }
}
