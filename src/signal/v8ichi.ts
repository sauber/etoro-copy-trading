import { EMA, RSI } from "@debut/indicators";
import { Instrument, Series } from "@sauber/backtest";
import { Limits } from "./indicator.ts";
import { EWO } from "../indicator/ewo.ts";
import { HMA } from "../indicator/hma.ts";
import { assert } from "@std/assert";
import { instruments } from "@sauber/etoro-investors";

export const limits: Limits = {
  low_offset: { min: 0.9, max: 0.99, default: 0.987 },
  high_offset: { min: 0.95, max: 1.1, default: 1.008 },
  high_offset_2: { min: 0.99, max: 1.5, default: 1.016 },
  ewo_high: { min: 2.0, max: 12.0, default: 3.147 },
  ewo_low: { min: -20.0, max: 8.0, default: -17.145 },
  rsi_buy: { min: 30, max: 70, default: 57, int: true },
  rsi_sell: { min: 30, max: 70, default: 50, int: true },
  ma_buy_period: { min: 5, max: 80, default: 12, int: true },
  ma_sell_period: { min: 5, max: 80, default: 22, int: true },
  hma_period: { min: 5, max: 100, default: 50, int: true },
  ewo_fast_period: { min: 2, max: 50, default: 50, int: true },
  ewo_slow_period: { min: 51, max: 84, default: 84, int: true },
  rsi_fast_period: { min: 2, max: 8, default: 4, int: true },
  rsi_period: { min: 7, max: 28, default: 14, int: true },
  rsi_slow_period: { min: 10, max: 40, default: 20, int: true },
};

export type Input = Record<keyof typeof limits, number>;

/** Minimum number of ticks required for the signal to compute */
const min_ticks = (values: Input): number =>
  Math.max(
    values.ma_buy_period,
    values.ma_sell_period,
    values.hma_period,
    values.ewo_slow_period,
    values.rsi_slow_period,
  );

/** caching of hma series */
const HMA_cache: Record<string, Series> = {};

/**
 * V8ichi Strategy
 * A strategy combining EMA, HMA, EWO, and RSI for trend following and mean reversion.
 */
function v8ichi(series: Series, values: Input, symbol: string): Series {
  const {
    low_offset,
    high_offset,
    high_offset_2,
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

  // Confirm if series has enough data points for the longest indicator period
  const required_length = min_ticks(values);
  if (series.length < required_length) return new Float32Array(series.length); // Not enough data, return neutral signals

  // chart(series, "price");

  // Indicators
  const ma_buy = new EMA(ma_buy_period);
  const ma_sell = new EMA(ma_sell_period);

  // RSIs
  const rsi_fast = new RSI(rsi_fast_period);
  const rsi_std = new RSI(rsi_period);
  const rsi_slow = new RSI(rsi_slow_period);

  // Pre-calculate HMA for the entire series
  const series_array = Array.from(series);
  // if (
  //   series_array.length < Math.max(ma_buy_period, ma_sell_period, hma_period)
  // ) {
  //   console.error({
  //     series_length: series.length,
  //     array_length: series_array.length,
  //     ma_buy_period,
  //     ma_sell_period,
  //     hma_period,
  //   });
  //   throw new Error(
  //     "Series length must be at least as long as the longest indicator period",
  //   );
  // }
  // const hma_full = HMA(series_array, hma_period);
  const hma_cache_key: string = symbol + "+" + hma_period;
  if (!(hma_cache_key in HMA_cache)) {
    HMA_cache[hma_cache_key] = new Float32Array(HMA(series_array, hma_period));
  }
  const hma_full = HMA_cache[hma_cache_key];

  // Pre-calculate EWO for the entire series
  const ewo_full = EWO(series_array, ewo_fast_period, ewo_slow_period);
  assert(ewo_full.length === series_array.length, "EWO length mismatch");

  const signals = series.map((price, index) => {
    // Update indicators
    const v_ma_buy = ma_buy.nextValue(price);
    const v_ma_sell = ma_sell.nextValue(price);
    const v_rsi_fast = rsi_fast.nextValue(price);
    const v_rsi = rsi_std.nextValue(price);
    const v_rsi_slow = rsi_slow.nextValue(price);
    const raw_ewo = ewo_full[index];
    const v_hma = hma_full[index];

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
      return 0;
    }

    // Calculate EWO (Normalized by price)
    const v_ewo = (raw_ewo / price) * 100;

    let signal = 0;

    // Entry conditions, buy if either is true
    // Buy condition #1 (Strong Uptrend)
    // (dataframe['rsi_fast'] < self.rsi_buy.value) &
    // (dataframe['close'] < (dataframe[f'ma_buy'] * self.low_offset.value)) &
    // (dataframe['close'] < (dataframe[f'ma_sell'] * self.high_offset.value)) &
    // (dataframe['EWO'] > self.ewo_high.value) &
    // (dataframe['rsi'] < self.rsi_buy.value)
    //
    // Buy condition #2 (Oversold)
    // (dataframe['rsi_fast'] < self.rsi_buy.value) &
    // (dataframe['close'] < (dataframe[f'ma_buy'] * self.low_offset.value)) &
    // (dataframe['close'] < (dataframe[f'ma_sell'] * self.high_offset.value)) &
    // (dataframe['EWO'] < self.ewo_low.value)

    // --- Entry Logic ---
    const fast_rsi_dip = v_rsi_fast < rsi_buy;
    const price_below_ma = price < (v_ma_buy * low_offset);
    const resistance_check = price < (v_ma_sell * high_offset);
    const strong_uptrend = (v_ewo > ewo_high) && (v_rsi < rsi_buy);
    const oversold = v_ewo < ewo_low;

    // Bring range of oversold to 0 into range of 0 to -1
    if (price_below_ma && resistance_check && fast_rsi_dip) {
      if (strong_uptrend) {
        signal = (v_rsi - rsi_buy) / rsi_buy;
      }
      if (oversold) {
        // EWO is usually within [-20;20] interval
        const osignal = (ewo_low - v_ewo) / (20 + ewo_low);
        signal -= osignal;
      }
      // Clip if outside range
      signal = Math.tanh(signal);
    }

    // Exit Conditions, sell if either is true
    // Sell condition #1 (Take Profit)
    // (dataframe['close'] > dataframe['hma'])&
    // (dataframe['rsi_fast'] > dataframe['rsi_slow']) &
    // (dataframe['close'] > (dataframe[f'ma_sell'] * self.high_offset_2.value)) &
    // (dataframe['rsi'] > self.rsi_sell.value)&
    //
    // Sell condition #2 (Weakness)
    // (dataframe['close'] < dataframe['hma'])&
    // (dataframe['rsi_fast'] > dataframe['rsi_slow']) &
    // (dataframe['close'] > (dataframe[f'ma_sell'] * self.high_offset.value))

    const price_above_hma = price > v_hma;
    const fast_rsi_cross = v_rsi_fast > v_rsi_slow;

    if (price_above_hma && fast_rsi_cross) {
      // Sell condition #1
      if (price > (v_ma_sell * high_offset_2) && v_rsi > rsi_sell) {
        signal = (v_rsi - rsi_sell) / (100 - rsi_sell);
      }

      // Sell condition #2
      if (price > (v_ma_sell * high_offset)) {
        const above = price - (v_ma_sell * high_offset);
        signal += above / (v_ma_sell * high_offset);
      }
      // Bend values to range
      signal = Math.tanh(signal);
    }

    return signal;
  });

  return new Float32Array(signals);
}

export { v8ichi as signal };
