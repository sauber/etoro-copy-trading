import { Community, type Investors, type Names } from "📚/repository/mod.ts";
import type { Chart } from "📚/chart/mod.ts";

type Charts = Array<Chart>;

/** Load all charts */
export class TrainingData {
  constructor(private readonly community: Community) {}

  /** Load all investors, and rextract chart from each */
  private async load(): Promise<Charts> {
    const names: Names = await this.community.allNames();
    const investors: Investors = await Promise.all(
      names.map((name) => this.community.investor(name)),
    );
    return investors.map((i) => i.chart);
  }
}
