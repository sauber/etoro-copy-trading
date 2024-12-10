import { Exchange, Simulation, Stats, Strategy } from "@sauber/backtest";
import {
  IntegerParameter,
  Minimize,
  Parameter,
  ParameterData,
  Parameters,
} from "📚/optimize/mod.ts";
import { RSIStrategy } from "📚/timing/rsi-strategy.ts";

function makeParameters(): Parameters {
  return [
    new IntegerParameter("Window", 2, 100),
    new IntegerParameter("Buy", 1, 50),
    new IntegerParameter("Sell", 50, 99),
    new IntegerParameter("Weekday", 1, 5),
  ];
}

// Values of window, buy, sell, weekday
type Input = [number, number, number, number];
type Output = number;

// Extract array of values from parameters
function values(parameters: Parameters): Input {
  return parameters.map((p) => p.value) as Input;
}

export type Dashboard = (
  iteration: number,
  momentum: number,
  parameters: Parameters,
) => void;

/** Exported data of model */
export type TimingData = Array<ParameterData>;

type Samples = Array<{ input: Parameters; output: number }>;

/** Generate and train parameters for timing model */
export class Model {
  constructor(private readonly parameters: Parameters = makeParameters()) {}

  /** Generate model from saved parameters */
  public static import(data: TimingData): Model {
    return new Model(data.map((d) => Parameter.import(d)));
  }

  /** Export parameters of model */
  public export(): TimingData {
    return this.parameters.map((p) => p.export());
  }

  /** Get results for a number of inputs */
  private samples(exchange: Exchange, count: number): Samples {
    const result: Samples = Array(count);
    for (let i = 0; i < count; i++) {
      const input: Parameters = makeParameters();
      const output: number = this.simulation(exchange, values(input));
      result[i] = { input, output };
    }
    return result;
  }

  /** Dump parameters and score */
  private print(exchange: Exchange): string {
    const v = (n: number): string => n.toFixed(4);
    const score = this.simulation(exchange, values(this.parameters));
    return `Score: ${v(score)} ` +
      this.parameters.map((p) => p.print()).join(", ");
  }

  /** Run simulation from input parameters and calculate score */
  private simulation(
    exchange: Exchange,
    values: Input,
  ): Output {
    // Configure a simulation using input parameters
    const strategy: Strategy = new RSIStrategy(...values);
    const simulation = new Simulation(exchange, strategy);

    // Run simulation
    simulation.run();

    // Extract score
    const stats: Stats = simulation.stats;
    const trades: number = stats.trades.length;
    const profit: number = stats.profit;
    const invested: number = stats.InvestedRatio;
    const win: number = stats.WinRatio;

    const scale: number = Math.abs(profit);
    // Normalize costs: 0=no cost, 1=worst cost
    // The more trades the worse
    const trades_cost: number = Math.tanh(
      trades / simulation.account.valuation.length,
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
    // Find starting point
    const samples: Samples = this.samples(exchange, 200);
    samples.sort((a, b) => b.output - a.output);
    const start = samples[0];
    start.input.map((p, i) => this.parameters[i].set(p.value));

    // Callback from optimize to model
    const loss = (input: Input): Output => {
      const score: Output = this.simulation(exchange, input);
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
    return this.simulation(exchange, values(this.parameters));
  }
}
