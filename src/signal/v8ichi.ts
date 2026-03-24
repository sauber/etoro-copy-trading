import { EMA, RSI } from "@debut/indicators";
import { Series } from "@sauber/backtest";
import { Limits } from "./indicator.ts";
import { EWO } from "../indicator/ewo.ts";
import { HMA } from "../indicator/hma.ts";

export const limits: Limits = {
  low_offset: { min: 0.85, max: 0.99, default: 0.96 },
  ewo_high: { min: 2.0, max: 15.0, default: 3.5 },
  ewo_low: { min: -15.0, max: 12.0, default: -3.5 },
  rsi_buy: { min: 10, max: 50, default: 30, int: true },
  rsi_sell: { min: 50, max: 90, default: 70, int: true },
  ma_buy_period: { min: 5, max: 30, default: 12, int: true },
  ma_sell_period: { min: 15, max: 100, default: 22, int: true },
  hma_period: { min: 20, max: 100, default: 50, int: true },
  ewo_fast_period: { min: 2, max: 50, default: 20, int: true },
  ewo_slow_period: { min: 50, max: 180, default: 140, int: true },
  rsi_fast_period: { min: 2, max: 10, default: 4, int: true },
  rsi_period: { min: 7, max: 21, default: 14, int: true },
  rsi_slow_period: { min: 15, max: 40, default: 20, int: true },
};

export type Input = Record<keyof typeof limits, number>;

/**
 * V8ichi Strategy
 * A strategy combining EMA, HMA, EWO, and RSI for trend following and mean reversion.
 */
function v8ichi(series: Series, values: Input): Series {
  const {
    low_offset,
    ewo_high,
    ewo_low,
    rsi_buy,
    rsi_sell,
    ma_buy_period,
    ma_sell_period,
    hma_period,
    ewo_fast_period,
    ewo_slow_period,
    rsi_fast_period,
    rsi_period,
    rsi_slow_period,
  } = values;

  // Indicators
  const ma_buy = new EMA(ma_buy_period);
  const ma_sell = new EMA(ma_sell_period);

  // RSIs
  const rsi_fast = new RSI(rsi_fast_period);
  const rsi_std = new RSI(rsi_period);
  const rsi_slow = new RSI(rsi_slow_period);

  // Pre-calculate HMA for the entire series
  // HMA function returns a shorter array, we must align indices
  const hma_full = HMA(Array.from(series), hma_period);
  const hma_offset = (hma_period - 1) +
    (Math.floor(Math.sqrt(hma_period)) - 1);

  // Pre-calculate EWO for the entire series
  const series_array = Array.from(series);
  const ewo_full = EWO(series_array, ewo_fast_period, ewo_slow_period);
  const ewo_offset = ewo_slow_period - 1;

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

    // if (dip_check && resistance_check && (strong_uptrend || oversold)) {
    //   signal = 1;
    // }

    // Bring range of oversold to 0 into range of 0 to -1
    if (dip_check && resistance_check) {
      if (strong_uptrend) {
        signal = Math.min(signal, (v_rsi - rsi_buy) / rsi_buy);
      }
      if (oversold) {
        signal = Math.min(signal, (v_ewo - ewo_low) / Math.abs(ewo_low));
      }
      signal = Math.max(-1, signal);
    }

    // --- Exit Logic ---
    const rsi_cross_up =
      (prev_rsi_fast !== undefined && prev_rsi_slow !== undefined) &&
      (prev_rsi_fast <= prev_rsi_slow) && (v_rsi_fast > v_rsi_slow);
    const take_profit = (price > v_hma) && (price > v_ma_sell) &&
      (v_rsi > rsi_sell) && rsi_cross_up;
    const exit_weakness = (price < v_hma) && (price > v_ma_sell);
    if (take_profit || exit_weakness) signal = 1;

    prev_rsi_fast = v_rsi_fast;
    prev_rsi_slow = v_rsi_slow;
    return signal;
  });

  return new Float32Array(signals);
}

export { v8ichi as signal };
