import { StatsResults } from "@sauber/etoro-investors";

/** Type of exported fields */
export type StatsExport = {
  CustomerId: number;
  UserName: string;
  DisplayFullName: boolean;
  FullName?: string;
  HasAvatar: boolean;
  PopularInvestor: boolean;
  IsFund: boolean;
  Gain: number;
  RiskScore: number;
  MaxDailyRiskScore: number;
  MaxMonthlyRiskScore: number;
  Copiers: number;
  CopiersGain: number;
  AUMTier: number;
  AUMTierV2: number;
  AUMTierDesc: string;
  VirtualCopiers: number;
  Trades: number;
  WinRatio: number;
  DailyDD: number;
  WeeklyDD: number;
  ProfitableWeeksPct: number;
  ProfitableMonthsPct: number;
  Velocity: number;
  Exposure: number;
  AvgPosSize: number;
  HighLeveragePct: number;
  MediumLeveragePct: number;
  LowLeveragePct: number;
  PeakToValley: number;
  LongPosPct: number;
  ActiveWeeks: number;
  ActiveWeeksPct: number;
  WeeksSinceRegistration: number;
};

/** Names of exported fields */
const props = [
  "CustomerId",
  "UserName",
  "DisplayFullName",
  "FullName",
  "HasAvatar",
  "PopularInvestor",
  "IsFund",
  "Gain",
  "RiskScore",
  "MaxDailyRiskScore",
  "MaxMonthlyRiskScore",
  "Copiers",
  "CopiersGain",
  "AUMTier",
  "AUMTierV2",
  "AUMTierDesc",
  "VirtualCopiers",
  "Trades",
  "WinRatio",
  "DailyDD",
  "WeeklyDD",
  "ProfitableWeeksPct",
  "ProfitableMonthsPct",
  "Velocity",
  "Exposure",
  "AvgPosSize",
  "HighLeveragePct",
  "MediumLeveragePct",
  "LowLeveragePct",
  "PeakToValley",
  "LongPosPct",
  "ActiveWeeks",
  "ActiveWeeksPct",
  "WeeksSinceRegistration",
] as const;

/** Format of raw data */
export type StatsData = {
  Data: StatsExport;
};

/** Stats data scraped from eToro */
export class Stats {
  constructor(private readonly raw: StatsResults) {}

  /** Confirm stats include CustomerId */
  public validate(): boolean {
    if (!this.raw.Data.CustomerId) throw new Error(`CustomerId missing`);
    return true;
  }

  /** Export subset of data */
  public get value(): StatsExport {
    const output = Object.fromEntries(
      props.map((key) => [key, this.raw.Data[key]]),
    ) as StatsExport;
    return output;
  }
}
