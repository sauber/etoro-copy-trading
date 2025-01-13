import { Exchange, Simulation, Strategy } from "@sauber/backtest";
import { IntegerParameter, Minimize, Parameters } from "📚/optimize/mod.ts";
import {
  CascadeStrategy,
  RSIStrategy,
  SizingStrategy,
  WeekdayStrategy,
} from "📚/strategy/mod.ts";

function makeParameters(value: Array<number> = []): Parameters {
  return [
    new IntegerParameter("window", 2, 100, value[0]),
    new IntegerParameter("buy", 1, 50, value[1]),
    new IntegerParameter("sell", 50, 99, value[2]),
    new IntegerParameter("weekday", 1, 5, value[3]),
  ];
}

// Values of window, buy, sell, weekday
type Input = [number, number, number, number];
type Output = number;
export type TradingData = {
  window: number;
  buy: number;
  sell: number;
  weekday: number;
};

export type Dashboard = (
  iteration: number,
  momentum: number,
  parameters: Parameters,
) => void;

/** Exported data of model */
// export type TimingData = Array<ParameterData>;

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
  public static best(of: number, exchange: Exchange): Optimize {
    // Find starting point
    const sampler = new Optimize();
    const samples: Samples = sampler.samples(exchange, of);
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
      new RSIStrategy(settings.window, settings.buy, settings.sell),
      new SizingStrategy(),
    ]);

    const simulation = new Simulation(exchange, strategy);

    // Run simulation
    simulation.run();

    // Extract score
    // const stats: Stats = simulation.stats;
    const trades: number = simulation.account.trades.length;
    const profit: number = simulation.account.profit;
    const invested: number = simulation.account.InvestedRatio;
    const win: number = simulation.account.WinRatio;

    const scale: number = Math.abs(profit);
    // Normalize costs: 0=no cost, 1=worst cost
    // The more trades the worse
    const trades_cost: number = Math.tanh(
      trades / simulation.account.bars,
    );
    // The more uninvested cash invested the worse
    const cash_cost = 1 - invested;
    // The more losses the worse
    const lose_cost = 1 - win;
    // Scale each cost to profit
    const costs = scale * (trades_cost + cash_cost + lose_cost) / 3;
    // Subtract cost from profit;
    const score = profit - costs;

    return score;
  }

  /** Train model */
  public optimize(
    exchange: Exchange,
    epochs: number = 500,
    epsilon: number = 0.001,
    status: Dashboard = () => undefined,
  ): number {
    // Callback from optimize to model
    const loss = (input: Input): Output => {
      const score: Output = this.simulation(exchange, makeParameters(input));
      return -score;
    };

    // Configure minimizer
    const minimizer = new Minimize({
      parameters: this.parameters,
      fn: loss as (inputs: Array<number>) => number,
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
