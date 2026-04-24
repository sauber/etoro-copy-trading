import { Series } from "@sauber/backtest";
import { linechart } from "@sauber/widgets";

/** Plot cash and equity line charts */
export function simulationPlot(
  cash: Series,
  equity: Series,
  width: number = 78,
  height: number = 11,
): string {
  const ansiRedColor = "\x1b[31m";
  const ansiGreenColor = "\x1b[32m";

  const chart = linechart(
    [Array.from(equity), Array.from(cash)],
    height,
    width,
    [ansiRedColor, ansiGreenColor],
  );
  return chart;
}
