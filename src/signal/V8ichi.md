# V8ichi Strategy Explained

This is a moderately complex strategy designed for taking long positions
(buying) on a 1-hour timeframe. It does not open short positions. The strategy's
logic is built upon a combination of several technical indicators to identify
entry and exit points, and it is heavily parameterized for optimization
(hyperopt).

## Core Indicators Used:

Exponential Moving Averages (EMA):

ma_buy (default period: 12): Used to establish a dynamic support level for
entries. ma_sell (default period: 22): Used to establish dynamic resistance
levels for entries and exits. Hull Moving Average (HMA):

hma (default period: 50): A faster, smoother moving average used primarily in
the exit logic to detect trend changes quickly. Elliot Wave Oscillator (EWO):

This is a custom momentum indicator calculated as the difference between a fast
EMA (period 50) and a slow EMA (period 200), normalized by price. High positive
values suggest strong upward momentum. Very low negative values suggest a deeply
oversold condition. Relative Strength Index (RSI):

The strategy uses three different RSI calculations: rsi_fast (period 4), rsi
(period 14), and rsi_slow (period 20). These are used to measure momentum and
identify overbought/oversold conditions.

## Entry Logic (When to Buy)

The strategy will generate a buy signal if one of two main scenarios occurs.
It's looking to buy on a price dip under specific market conditions.

A buy signal is triggered if the price dips below the ma_buy EMA (multiplied by
a low_offset), and EITHER:

### Strong Uptrend Condition:

The EWO is very high (> ewo_high), indicating strong upward momentum. AND the
RSI is not in overbought territory (< rsi_buy). This condition aims to buy a
small dip within a strong, established uptrend.

### Deeply Oversold (Mean Reversion) Condition:

The EWO is extremely low (< ewo_low), indicating the asset is deeply oversold.
This condition aims to buy when the price is expected to revert to its mean
(bounce back up) after a significant drop. In both cases, a final check ensures
the price is still below a resistance level defined by ma_sell, preventing buys
into immediate resistance.

## Exit Logic (When to Sell)

The strategy defines sell signals to take profit or cut a trade if the trend
appears to be reversing. A sell signal is triggered if EITHER:

### Take Profit on Strength:

The price is above the Hull Moving Average (hma). The price has surged
significantly above the ma_sell resistance band. RSI is indicating the asset is
becoming overbought (> rsi_sell). The fast RSI has crossed above the slow RSI,
which can signal peaking momentum.

### Exit on Weakness:

The price has crossed below the Hull Moving Average (hma), signaling a potential
trend reversal. AND the price is still above the ma_sell resistance band. Risk
and Profit Management Stop-loss: It has a wide static stop-loss of -20%. This
acts as a safety net, but the strategy primarily relies on its other exit
mechanisms. Trailing Stop-loss: This is the main profit-protection tool. It's
configured to activate once a trade is in 0.1% profit and will then trail the
price by a 2% offset, locking in gains as the price moves up. Minimal ROI: The
minimal_roi is set to take profit at 99%, which is very high. This effectively
means the strategy will almost always exit based on the populate_exit_trend
signals or the trailing stop-loss, rather than a fixed ROI target.
