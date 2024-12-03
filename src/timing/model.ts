import { Exchange, Simulation, Stats, Strategy } from "@sauber/backtest";
import { Dashboard } from "@sauber/ml-cli-dashboard";
import { correlation } from "jsr:@sauber/statistics";
import {
  IntegerParameter,
  Parameter,
  ParameterData,
} from "📚/optimize/parameter.ts";
import { TimingStrategy } from "📚/timing/strategy.ts";
import { Minimize } from "📚/optimize/minimize.ts";

type Parameters = Record<string, Parameter>;

function makeParameters(): Parameters {
  return {
    window: new IntegerParameter("Window", 2, 100),
    buy: new IntegerParameter("Buy", 1, 50),
    sell: new IntegerParameter("Sell", 50, 99),
    weekday: new IntegerParameter("Weekday", 1, 5),
  };
}

// Values of window, buy, sell, weekday
type Input = [number, number, number, number];
type Output = number;

// export type Dashboard = (x: number, y: number[]) => void;

/** Exported data of model */
export type TimingData = Record<string, ParameterData>;

// export type Input = {
//   window: number;
//   buy: number;
//   sell: number;
//   weekday: number;
// };

export type TrainResults = {
  iterations: number;
  loss: number;
};

type Samples = Array<{ input: Parameters; output: number }>;

// Convert Parameters to input
// function input(parameters: Parameters): Input {
//   return {
//     window: parameters.window.value,
//     buy: parameters.buy.value,
//     sell: parameters.sell.value,
//     weekday: parameters.weekday.value,
//   };
// }

/** Generate and train a neural network model */
export class Model {
  constructor(
    private readonly exchange: Exchange,
    private readonly parameters: Parameters = makeParameters(),
  ) {}

  /** Generate model from saved parameters */
  public static import(exchange: Exchange, data: TimingData): Model {
    const parameters: Parameters = {};
    for (const [key, value] of Object.entries(data)) {
      parameters[key] = Parameter.import(value);
    }
    return new Model(exchange, parameters);
  }

  /** Export parameters of model */
  public export(): TimingData {
    const result: Record<string, ParameterData> = {};
    for (const [key, value] of Object.entries(this.parameters)) {
      result[key] = value.export();
    }
    return result;
  }

  /** A collection of random parameters */
  // private static samples(count: number): Samples {
  //   return Array.from(Array(count).keys().map(() => makeParameters()));
  // }

  // Extract value from parameters to predict function
  private input(
    parameters: Parameters,
    override: Record<string, number> = {},
  ): Input {
    return ["window", "buy", "sell", "weekday"].map((key) =>
      override[key] || parameters[key].value
    ) as Input;
  }

  /** Get results for a number of inputs */
  private samples(count: number): Samples {
    const result: Samples = Array(count);
    for (let i = 0; i < count; i++) {
      const input = makeParameters();
      const output: number = this.predict(...this.input(input));
      result[i] = { input, output };
    }
    return result;
  }

  /** Top two parameters most correlated to output */
  private correlation(samples: Samples): [number, number] {
    const keys = Object.keys(this.parameters);
    const output: Array<number> = samples.map((s) => s.output);
    const corr: Array<[string, number, number]> = keys.map((key, index) => {
      const input: Array<number> = samples.map((s) => s.input[key].value);
      const cor = correlation(input, output);
      return [key, cor, index];
    });
    corr.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const top2 = [corr[0][2], corr[1][2]] as [number, number];
    // console.log({ corr, top2 });
    return top2;
  }

  /**
   * Train model
   *     inputs: Inputs,
    outputs: Outputs,
    max_iterations: number = 20000,
    learning_rate: number = 0.001,
    batch_size: number = 64,
    callback?: Dashboard,
   * */
  public optimize(epochs: number = 500): TrainResults {
    // Find starting point
    const samples = this.samples(200);

    // Find most correlated columns
    const [xcol, ycol] = this.correlation(samples);
    const xlabel = Object.values(this.parameters)[xcol].name;
    const ylabel = Object.values(this.parameters)[ycol].name;
    // console.log({xcol, ycol, xlabel, ylabel});

    // Trail of parameters towards minimum
    const xs: Array<[number, number]> = [];
    const ys: Array<Output> = [];

    // Callback from dashboard to model
    const input = (
      parameters: Parameters,
      override: Record<string, number>,
    ): Input => {
      return this.input(parameters, override);
    };

    const predict = (input: Input): Output => {
      return this.predict(...input);
    };
    // console.log(predict);
    const parameters = this.parameters;
    function sample(x: number, y: number): number {
      const inputs: Input = input(parameters, { [xlabel]: x, [ylabel]: y });
      const output: Output = predict(inputs);
      return -output;
    }

    // Callback from optimize to model
    function loss(input: Input): number {
      const score: Output = predict(input);
      return -score;
    }

    // Dashboard
    const width = 74;
    const height = 12;
    const dashboard = new Dashboard(
      width,
      height,
      xs,
      ys,
      sample,
      epochs,
      xlabel,
      ylabel,
    );

    // Callback from optimizer to dashboard
    function status(
      iteration: number,
      xi: Array<number>,
      yi: Output,
      _momentum: number,
    ): void {
      xs.push([xi[xcol], xi[ycol]]);
      ys.push(yi);
      console.log(dashboard.render(iteration, yi));
      // console.log(parameters.map(p=>p.print()).join(", "), yi);
    }

    // Configure minimizer
    const minimizer = new Minimize({
      parameters: Object.values(parameters),
      fn: loss as (inputs: Array<number>) => number,
      epochs,
      status,
      every: 10,
      epsilon: 0.0001,
      batchSize: 20,
    });

    const iterations = minimizer.run();

    return { iterations, loss: 0 };
  }

  /** Run simulation from input parameters and calculate score */
  public predict(
    window: number,
    buy: number,
    sell: number,
    weekday: number,
  ): number {
    // Configure a simulation using input parameters
    const strategy: Strategy = new TimingStrategy(window, buy, sell, weekday);
    const simulation = new Simulation(this.exchange, strategy);

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
}
