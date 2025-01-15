import { Parameter, Parameters } from "📚/optimize/parameter.ts";
import { Line } from "../optimize/line.ts";
import { Iteration } from "@sauber/ml-cli-dashboard";
import { Output } from "📚/optimize/types.d.ts";
import { plot } from "asciichart";
import { downsample } from "@sauber/statistics";

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
  public gauges(parameters: Parameters, width: number): string[] {
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
    const barWidth: number = width - nameWidth - minWidth - maxWidth -
      seperators;
    const bars: string[] = parameters.map((p) => this.gauge(p, barWidth));

    // Combine columns into lines
    const lines: string[] = names.map((name, i) =>
      new Line(nameWidth).end(name).line + " " +
      new Line(minWidth).end(mins[i]).line +
      " [" + bars[i] + "] " +
      new Line(maxWidth).start(maxs[i]).line
    );
    return lines;
  }

  private reward(
    reward: Array<Output>,
    width: number,
    height: number,
  ): string[] {
    // Not enough numbers for chart
    if (reward.length < 2) {
      const blank = " ".repeat(width);
      return Array(height).fill(blank);
    }

    // Max width of Y axis labels
    const labelWidth: number = Math.max(
      ...[reward[0], reward[reward.length - 1]].map((l) =>
        l.toFixed(2).toString().length
      ),
    );
    const padding: string = " ".repeat(labelWidth);
    const config = { padding, height, width };
    const downsampled: number[] = downsample(reward, width - labelWidth);

    return plot(downsampled, config).split("\n");
  }

  /** Combine chart components */
  public render(
    parameters: Parameters,
    iteration: number,
    reward: Array<Output>,
  ): string {
    // Vertical Seperator
    const seperator = " ‖ ";

    // Get each component
    const width: number = Math.floor((this.width - seperator.length) / 2);
    const gauges: string[] = this.gauges(parameters, width);
    const chart: string[] = this.reward(reward, width, gauges.length - 1);
    const eta: string = this.progress.render(iteration);

    // Combine components
    const lines: string[] = gauges.map((g, index) =>
      g + seperator + chart[index]
    );
    const up: string = this.first
      ? ""
      : ESC + (lines.length + 1).toString() + LINEUP;
    this.first = false;
    return up + lines.join("\n") + "\n" + eta;
  }
}
