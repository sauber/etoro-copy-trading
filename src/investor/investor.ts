import type { DateFormat } from "📚/utils/time/mod.ts";

export class Investor {
  constructor(
    private readonly UserName: string,
    private readonly CustomerID: number,
    private readonly chart: number[],
    private readonly end: DateFormat,
    // stats
    // portfolio
  ){}
}