# Strategies for using technical indicators for buy/sell decision

## Optimization

Indicators have parameters, sich as window size or thresholds. Run optimization to find optimale parameters.

* Define boundaries of indicators. Some boundaries may be inter-dependent. For example slow SMA must be slower that fast SMA.

* Pick one or more randoms starting points.

* Repeat until convergence:
** For each parameters:
*** Pick some random sample points, keep all other parameters unchanged.
*** Calculate performance for each of the sample points.
*** Perform quadratic regression on all sample points, and find location of peak.
*** Compare peak to each boundary, and pick highest one.
*** From current position, take a step towards projected highest point (peak or boundary).

