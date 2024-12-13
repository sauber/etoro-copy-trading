import { Parameter, Parameters } from "📚/optimize/parameter.ts";
import { Line } from "../optimize/line.ts";
import { Iteration } from "@sauber/ml-cli-dashboard";

// ANSI escape codes
const ESC = "\u001B[";
const LINEUP = "F";

/** Maximum width of array of string */
function colWidth(labels: string[]): number {
  return Math.max(...labels.map((l) => l.length));
}

/** Render a number as a string*/
function num(n: number): string {
  return parseFloat(n.toPrecision(3)).toString();
}

////////////////////////////////////////////////////////////////////////

/** Visualize parameters */
export class Dashboard {
  /** First run? */
  private first: boolean = true;
  private readonly progress: Iteration;

  constructor(
    private readonly max_iterations: number = 1,
    private readonly width: number = 78,
  ) {
    this.progress = new Iteration(max_iterations, width);
  }

  // Render a range for parameter: [Min:Max]
  // private range(p: Parameter): string {
  //   return `${num(p.min)}:${num(p.max)}`;
  // }

  /** Display bar for a parameter */
  private gauge(p: Parameter, width: number): string {
    // Relative distance of Value from Min
    const distance = (p.value - p.min) / (p.max - p.min);

    // Total amount of chars available for the bar itself
    const fill: string = "=".repeat(Math.round(width * distance));
    const bar: Line = new Line(width, " ").start(fill);
    const label: string = num(p.value);
    if (label.length + fill.length + 1 < width) {
      bar.start(label, fill.length + 1);
    } else bar.end(label, fill.length - 1);
    return bar.line;
  }

  /** Display gauge for one parameter on each line
   * Low type:
   * Name   0 [====== 16.67      ] 50
   * High type:
   * Name 100 [===== 86.67 =     ] 100
   */
  public render(parameters: Parameters, iteration: number): string {
    // Label column
    const names: string[] = parameters.map((p) => p.name);
    const nameWidth: number = colWidth(names);

    // Column of minimum values
    const mins: string[] = parameters.map((p) => num(p.min));
    const minWidth: number = colWidth(mins);

    // Column of maximum values
    const maxs: string[] = parameters.map((p) => num(p.max));
    const maxWidth: number = colWidth(maxs);

    // Column of bars
    const seperators = 5;
    const barWidth: number = this.width - nameWidth - minWidth - maxWidth -
      seperators;
    const bars: string[] = parameters.map((p) => this.gauge(p, barWidth));

    // Combine columns into lines
    const lines: string[] = names.map((name, i) =>
      new Line(nameWidth).end(name).line + " " +
      new Line(minWidth).end(mins[i]).line +
      " [" + bars[i] + "] " +
      new Line(maxWidth).start(maxs[i]).line
    );
    lines.push(this.progress.render(iteration));
    const chart: string = lines.join("\n");

    // Move cursor up on subsequent renderings
    const up: string = this.first ? "" : ESC + lines.length.toString() + LINEUP;
    this.first = false;
    return up + chart;
  }
}
