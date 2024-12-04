import { Parameter, Parameters } from "📚/optimize/parameter.ts";
import { Line } from "../optimize/line.ts";

// ANSI escape codes
const ESC = "\u001B[";
const LINEUP = "F";

/** Maximum width of array of string */
function maxWidth(labels: string[]): number {
  return Math.max(...labels.map((l) => l.length));
}

/** Render a number as a string*/
function num(n: number): string {
  return parseFloat(n.toFixed(4)).toString();
}

////////////////////////////////////////////////////////////////////////

/** Visualize parameters */
export class Dashboard {
  /** First run? */
  private first: boolean = true;

  constructor(private readonly width: number = 78) {}

  // Render a range for parameter: [Min:Max]
  private range(p: Parameter): string {
    return `${num(p.min)}:${num(p.max)}`;
  }

  /** Display bar for a parameter
   * Low type:
   * Name |====== 66.66      | [50:100]
   * High type:
   * Name |===== 86.66 =     | [50:100]
   */
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

  /** Display gauge for one parameter on each line */
  public render(parameters: Parameters): string {
    const names: string[] = parameters.map((p) => p.name);
    const ranges: string[] = parameters.map((p) => this.range(p));
    const nameWidth: number = maxWidth(names);
    const rangeWidth: number = maxWidth(ranges);
    const barWidth: number = this.width - nameWidth - rangeWidth - 4;
    const bars: string[] = parameters.map((p) => this.gauge(p, barWidth));

    const lines: string[] = names.map((n, i) =>
      new Line(nameWidth).end(n).line +
      " [" +
      bars[i] +
      "] " +
      new Line(rangeWidth).start(ranges[i]).line
    );
    const chart: string = lines.join("\n");

    const HOME: string = ESC + parameters.length.toString() + LINEUP;
    const up: string = this.first ? "" : HOME;
    this.first = false;
    return up + chart;
  }
}
