import { EMA, RSI } from "@debut/indicators";
import { Series } from "@sauber/backtest";
import { Limits } from "./indicator.ts";
import { EWO } from "../indicator/ewo.ts";
import { HMA } from "../indicator/hma.ts";

export const limits: Limits = {
  low_offset: { min: 0.85, max: 0.99, default: 0.96 },
  ewo_high: { min: 2.0, max: 15.0, default: 3.5 },
  ewo_low: { min: -15.0, max: -2.0, default: -3.5 },
  rsi_buy: { min: 30, max: 70, default: 50, int: true },
  rsi_sell: { min: 50, max: 90, default: 70, int: true },
};

export type Input = Record<keyof typeof limits, number>;

/**
 * V8ichi Strategy
 * A strategy combining EMA, HMA, EWO, and RSI for trend following and mean reversion.
 */
function v8ichi(series: Series, values: Input): Series {
  const { low_offset, ewo_high, ewo_low, rsi_buy, rsi_sell } = values;

  // Configuration (Fixed periods as per strategy description)
  const PERIODS = {
    MA_BUY: 12,
    MA_SELL: 22,
    HMA: 50,
    EWO_FAST: 50,
    EWO_SLOW: 200,
    RSI_FAST: 4,
    RSI: 14,
    RSI_SLOW: 20,
  };

  // Indicators
  const ma_buy = new EMA(PERIODS.MA_BUY);
  const ma_sell = new EMA(PERIODS.MA_SELL);

  // RSIs
  const rsi_fast = new RSI(PERIODS.RSI_FAST);
  const rsi_std = new RSI(PERIODS.RSI);
  const rsi_slow = new RSI(PERIODS.RSI_SLOW);

  // Pre-calculate HMA for the entire series
  // HMA function returns a shorter array, we must align indices
  const hma_full = HMA(Array.from(series), PERIODS.HMA);
  const hma_offset = (PERIODS.HMA - 1) +
    (Math.floor(Math.sqrt(PERIODS.HMA)) - 1);

  // Pre-calculate EWO for the entire series
  const series_array = Array.from(series);
  const ewo_full = EWO(series_array, PERIODS.EWO_FAST, PERIODS.EWO_SLOW);
  const ewo_offset = PERIODS.EWO_SLOW - 1;

  let prev_rsi_fast: number | undefined;
  let prev_rsi_slow: number | undefined;

  const signals = Array.from(series).map((price, index) => {
    // Update indicators
    const v_ma_buy = ma_buy.nextValue(price);
    const v_ma_sell = ma_sell.nextValue(price);
    const v_rsi_fast = rsi_fast.nextValue(price);
    const v_rsi = rsi_std.nextValue(price);
    const v_rsi_slow = rsi_slow.nextValue(price);

    // Get HMA value (aligned)
    const hma_index = index - hma_offset;
    const v_hma = hma_index >= 0 ? hma_full[hma_index] : undefined;

    // Get EWO value (aligned)
    const ewo_index = index - ewo_offset;
    const raw_ewo = ewo_index >= 0 ? ewo_full[ewo_index] : undefined;

    // Check data sufficiency
    if (
      v_ma_buy === undefined ||
      v_ma_sell === undefined ||
      raw_ewo === undefined ||
      v_rsi_fast === undefined ||
      v_rsi === undefined ||
      v_rsi_slow === undefined ||
      v_hma === undefined
    ) {
      prev_rsi_fast = v_rsi_fast;
      prev_rsi_slow = v_rsi_slow;
      return 0;
    }

    // Calculate EWO (Normalized by price)
    const v_ewo = (raw_ewo / price) * 100;

    let signal = 0;

    // --- Entry Logic ---
    const dip_check = price < (v_ma_buy * low_offset);
    const resistance_check = price < v_ma_sell;
    const strong_uptrend = (v_ewo > ewo_high) && (v_rsi < rsi_buy);
    const oversold = v_ewo < ewo_low;
    if (dip_check && resistance_check && (strong_uptrend || oversold)) {
      signal = 1;
    }

    // --- Exit Logic ---
    const rsi_cross_up =
      (prev_rsi_fast !== undefined && prev_rsi_slow !== undefined) &&
      (prev_rsi_fast <= prev_rsi_slow) && (v_rsi_fast > v_rsi_slow);
    const take_profit = (price > v_hma) && (price > v_ma_sell) &&
      (v_rsi > rsi_sell) && rsi_cross_up;
    const exit_weakness = (price < v_hma) && (price > v_ma_sell);
    if (take_profit || exit_weakness) signal = -1;

    prev_rsi_fast = v_rsi_fast;
    prev_rsi_slow = v_rsi_slow;
    return signal;
  });

  return new Float32Array(signals);
}

export { v8ichi as signal };
