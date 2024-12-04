import { Exchange, Simulation, Stats, Strategy } from "@sauber/backtest";
// import { Dashboard } from "@sauber/ml-cli-dashboard";
// import { correlation } from "jsr:@sauber/statistics";
import {
  IntegerParameter,
  Minimize,
  Parameter,
  ParameterData,
  Parameters,
} from "📚/optimize/mod.ts";
import { TimingStrategy } from "📚/timing/strategy.ts";

// type Parameters = Record<string, Parameter>;

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

export type Dashboard = (x: number, y: number[]) => void;

/** Exported data of model */
export type TimingData = Array<ParameterData>;

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

  /** A collection of random parameters */
  // private static samples(count: number): Samples {
  //   return Array.from(Array(count).keys().map(() => makeParameters()));
  // }

  // Extract value from parameters to predict function
  // private get input(
  //   // parameters: Parameters,
  //   // override: Record<string, number> = {},
  // ): Input {
  //   // return ["window", "buy", "sell", "weekday"].map((key) =>
  //   //   override[key] || parameters[key].value
  //   // ) as Input;
  //   return this.parameters.map((p) => p.value) as Input;
  // }

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

  /** Top two parameters most correlated to output */
  // private correlation(samples: Samples): [number, number] {
  //   const keys = Object.keys(this.parameters);
  //   const output: Array<number> = samples.map((s) => s.output);
  //   const corr: Array<[string, number, number]> = keys.map((key, index) => {
  //     const input: Array<number> = samples.map((s) => s.input[key].value);
  //     const cor = correlation(input, output);
  //     return [key, cor, index];
  //   });
  //   corr.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  //   const top2 = [corr[0][2], corr[1][2]] as [number, number];
  //   // console.log({ corr, top2 });
  //   return top2;
  // }

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
    const strategy: Strategy = new TimingStrategy(...values);
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

  /**
   * Train model
   *     inputs: Inputs,
    outputs: Outputs,
    max_iterations: number = 20000,
    learning_rate: number = 0.001,
    batch_size: number = 64,
    callback?: Dashboard,
   * */
  public optimize(exchange: Exchange, epochs: number = 500): TrainResults {
    // Find starting point
    const samples: Samples = this.samples(exchange, 200);
    samples.sort((a, b) => b.output - a.output);
    const start = samples[0];
    console.log("Start score:", start.output);
    start.input.map((p, i) => this.parameters[i].set(p.value));
    console.log(this.print(exchange));

    //   // Find most correlated columns
    //   const [xcol, ycol] = this.correlation(samples);
    //   const xlabel = Object.values(this.parameters)[xcol].name;
    //   const ylabel = Object.values(this.parameters)[ycol].name;
    //   // console.log({xcol, ycol, xlabel, ylabel});

    //   // Trail of parameters towards minimum
    //   const xs: Array<[number, number]> = [];
    //   const ys: Array<Output> = [];

    //   // Callback from dashboard to model
    //   const input = (
    //     parameters: Parameters,
    //     override: Record<string, number>,
    //   ): Input => {
    //     return this.input(parameters, override);
    //   };

    //   const predict = (input: Input): Output => {
    //     return this.predict(...input);
    //   };
    //   // console.log(predict);
    //   const parameters = this.parameters;
    //   function sample(x: number, y: number): number {
    //     const inputs: Input = input(parameters, { [xlabel]: x, [ylabel]: y });
    //     const output: Output = predict(inputs);
    //     return -output;
    //   }

    // Callback from optimize to model
    const loss = (input: Input): Output => {
      const score: Output = this.simulation(exchange, input);
      return -score;
    };

    //   // Dashboard
    //   const width = 74;
    //   const height = 12;
    //   const dashboard = new Dashboard(
    //     width,
    //     height,
    //     xs,
    //     ys,
    //     sample,
    //     epochs,
    //     xlabel,
    //     ylabel,
    //   );

    // Callback from optimizer to dashboard
    const status = (
      _iteration: number,
      _xi: Array<number>,
      _yi: Output,
      _momentum: number,
    ): void => {
      // xs.push([xi[xcol], xi[ycol]]);
      // ys.push(yi);
      // console.log(dashboard.render(iteration, yi));
      // console.log(this.parameters.map((p) => p.print()).join(", "), yi);
      console.log(this.print(exchange));
    };

    // Configure minimizer
    const minimizer = new Minimize({
      parameters: this.parameters,
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

  public predict(exchange: Exchange): Output {
    return this.simulation(exchange, values(this.parameters));
  }
}
