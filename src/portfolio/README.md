# Portfolio Management

Running a number of portfolio management strategies against a current portfolio, and
suggest current positions to close or new positions to open.

## High Level Process

1. Decide how much money should be invested, and how much should be available cash
2. Identify which positions are currently open
3. Close positions with expired data
4. Close positions at takeprofit and stoploss limits
5. Identify how the ideal portfolio would look like, based on ranking of investors.
6. Desired investors where not enough investment
7. Identify 

| Desired                 | Undesired |
| ---  | --- |
| buy: Desired and buy signal  | ignore: Undesired and buy signal |
| sell2: Desired and sell signal | sell1: Undesired and sell signal |

8. Close undesired with sell signal (sell1)
9. If necesseary to meet currently desired investment level, also close off desired with sell signal (sell2)
10. Buy desired with buy signal. Amount depends on strength of buy signal. Skip too small investments. Stay within desired investment level.

## Chain of strategies

Strategies should be built in seperate classes, each doing only one thing. Examples below. 

## Chain

Link multiple strategies together

### Situation

Generate a list of all open positions and all available investors.

Input: community, book

### Ranking

Attach a ranking score to each investor

Input: investors, ranking model

### Timing

Attach a timing score to each investor

Input: investors, timing model

### Targets

Based on ranking, how much should be invested in each investor

### Gap

Based on current investment and targets, what remains to be openend or closed

### Minimum

Minimum amount to open or close:

Input: open threshold and close threshold

### Limit

Maximum count to open or close.

Input: Criteria for sorting

### Weekday

Only open or close on certain weekday:

Input: weekday for open or close

## Expire

Exit positions that no longer have data


