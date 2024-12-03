import { Exchange, Simulation, Stats, Strategy } from "@sauber/backtest";
import { Parameter, ParameterData, Parameters } from "📚/optimize/parameter.ts";
import { RSIStrategy } from "📚/timing/strategy.ts";

// export type Dashboard = (x: number, y: number[]) => void;

export type TimingData = Array<ParameterData>;

export type Input = {
  window: number;
  buy: number;
  sell: number;
  weekday: number;
};

/** Generate and train a neural network model */
export class Model {
  constructor(private readonly parameters: Parameters) {}

  /** Generate new model with random parameters */
  public static generate(): Model {
    // Random initial values
    const parameters: Parameters = [
      new Parameter("Window", 2, 100),
      new Parameter("Buy", 1, 50),
      new Parameter("Sell", 50, 99),
      new Parameter("Weekday", 1, 5),
    ];

    // TODO: Generate a number of inputs to find best starting point

    return new Model(parameters);
  }

  /** Generate model from save parameters */
  public static import(data: TimingData) {
    return new Model(
      data.map((p) => new Parameter(p.name, p.min, p.max, p.value)),
    );
  }

  /** Export parameters of model */
  public export(): TimingData {
    return this.parameters.map((p) => p.export());
  }

  /** Simulation score from input parameters */
  public predict(input: Input, exchange: Exchange): number {
    // Configure a simulation using input parameters
    const strategy: Strategy = new RSIStrategy(
      Math.round(input.window),
      input.buy,
      input.sell,
      Math.round(input.weekday),
    );
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
}
