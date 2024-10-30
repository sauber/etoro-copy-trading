/** Input column names */
export const input_labels = [
  "PopularInvestor",
  "Gain",
  "RiskScore",
  "MaxDailyRiskScore",
  "MaxMonthlyRiskScore",
  "Copiers",
  "CopiersGain",
  "AUMTier",
  "AUMTierV2",
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

/** 25 input parameters from stats */
export type Input = {
  PopularInvestor: number;
  Gain: number;
  RiskScore: number;
  MaxDailyRiskScore: number;
  MaxMonthlyRiskScore: number;
  Copiers: number;
  CopiersGain: number;
  AUMTier: number;
  AUMTierV2: number;
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

/** List of inputs */
export type Inputs = Array<Input>;

/** Output column names */
export const output_labels = ["SharpeRatio"] as const;

/** One output parameter; SharpeRatio */
export type Output = {
  SharpeRatio: number;
};

/** List of outputs */
export type Outputs = Array<Output>;
