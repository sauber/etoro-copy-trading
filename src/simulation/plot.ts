import { Backtest, Series } from "@sauber/backtest";
import { downsample } from "@sauber/statistics";
import * as asciichart from "asciichart";

/** Plot cash and equity line charts */
export function simulationPlot(
  simulation: Backtest,
  width: number = 78,
  height: number = 15,
): string {
  const cash: Series = simulation.cash;
  const equity: Series = simulation.value;

  const axisWidth = Math.max(
    ...[cash[0], cash[cash.length - 1], equity[0], equity[equity.length - 1]]
      .map((v) => v.toFixed(2).length),
  );

  const v1 = downsample(Array.from(cash), width - axisWidth - 2);
  const v2 = downsample(Array.from(equity), width - axisWidth - 2);
  const padding = " ".repeat(axisWidth);
  const config = {
    colors: [asciichart.green, asciichart.red],
    height: height - 1,
    padding,
  };

  return asciichart.plot([v1, v2], config);
}
