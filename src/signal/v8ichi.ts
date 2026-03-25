import { EMA, RSI } from "@debut/indicators";
import { Series } from "@sauber/backtest";
import { Limits } from "./indicator.ts";
import { EWO } from "../indicator/ewo.ts";
import { HMA } from "../indicator/hma.ts";
// import { linechart } from "@sauber/widgets";

export const limits: Limits = {
  low_offset: { min: 0.9, max: 0.99, default: 0.987 },
  high_offset: { min: 0.95, max: 1.1, default: 1.008 },
  high_offset_2: { min: 0.99, max: 1.5, default: 1.016 },
  ewo_high: { min: 2.0, max: 12.0, default: 3.147 },
  ewo_low: { min: -20.0, max: -8.0, default: -17.145 },
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

// function chart(series: Series | number[], title: string): void {
//   console.log(
//     title + "\n" + linechart(Array.from(series).map((v) => v || 0), 11, 72),
//   );
// }

/**
 * V8ichi Strategy
 * A strategy combining EMA, HMA, EWO, and RSI for trend following and mean reversion.
 */
function v8ichi(series: Series, values: Input): Series {
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

  // chart(series, "price");

  // Indicators
  const ma_buy = new EMA(ma_buy_period);
  const ma_sell = new EMA(ma_sell_period);

  // RSIs
  const rsi_fast = new RSI(rsi_fast_period);
  const rsi_std = new RSI(rsi_period);
  const rsi_slow = new RSI(rsi_slow_period);

  // Pre-calculate HMA for the entire series
  // HMA function returns a shorter array, we must align indices
  const series_array = Array.from(series);
  const hma_full = HMA(series_array, hma_period);
  const hma_offset = (hma_period - 1) +
    (Math.floor(Math.sqrt(hma_period)) - 1);

  // chart(hma_full, "hma");

  // Pre-calculate EWO for the entire series
  const ewo_full = EWO(series_array, ewo_fast_period, ewo_slow_period);
  const ewo_offset = ewo_slow_period - 1;

  // chart(ewo_full, "ewo");

  // let prev_rsi_fast: number | undefined;
  // let prev_rsi_slow: number | undefined;

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
      // prev_rsi_fast = v_rsi_fast;
      // prev_rsi_slow = v_rsi_slow;
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

    // if (dip_check && resistance_check && (strong_uptrend || oversold)) {
    //   signal = 1;
    // }

    // Bring range of oversold to 0 into range of 0 to -1
    if (price_below_ma && resistance_check && fast_rsi_dip) {
      if (strong_uptrend) {
        // signal = Math.min(signal, (v_rsi - rsi_buy) / rsi_buy);
        signal = (v_rsi - rsi_buy) / rsi_buy;
        // console.log({ v_rsi, rsi_buy });
        // signal = v_rsi - rsi_buy;
        signal = -1;
      }
      if (oversold) {
        // EWO is usually within [-20;20] interval
        // console.log({ v_ewo, ewo_low });
        signal -= (ewo_low - v_ewo) / (20 + ewo_low);
        signal = -1;
      }
      // Clip if outside range
      signal = Math.max(-1, signal);
      signal = -1;
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

    // --- Exit Logic ---
    // const rsi_cross_up =
    //   (prev_rsi_fast !== undefined && prev_rsi_slow !== undefined) &&
    //   (prev_rsi_fast <= prev_rsi_slow) && (v_rsi_fast > v_rsi_slow);
    // const take_profit = (price > v_hma) && (price > v_ma_sell) &&
    //   (v_rsi > rsi_sell) && rsi_cross_up;
    // const exit_weakness = (price < v_hma) && (price > v_ma_sell);
    // if (take_profit || exit_weakness) signal = 1;

    if (price_above_hma && fast_rsi_cross) {
      if (price > (v_ma_sell * high_offset_2) && v_rsi > rsi_sell) {
        // Sell condition #1
        // console.log({ price, v_ma_sell, high_offset_2, v_rsi, rsi_sell });
        signal = (v_rsi - rsi_sell) / (100 - rsi_sell);
      }
      if (price > (v_ma_sell * high_offset)) {
        // Sell condition #2
        const above = price - (v_ma_sell * high_offset);
        // console.log({ price, v_ma_sell, high_offset, v_rsi, rsi_sell, above });
        signal += above / (v_ma_sell * high_offset);
      }
      // Clip if outside range
      signal = Math.min(1, signal);
    }

    // prev_rsi_fast = v_rsi_fast;
    // prev_rsi_slow = v_rsi_slow;
    return signal;
  });

  // chart(signals, "signal");

  return new Float32Array(signals);
}

export { v8ichi as signal };
