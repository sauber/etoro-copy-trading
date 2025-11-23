# Chart Signals

Find entry and exit opportinues in charts

## Training

- Load in all charts
- Load or define a neural network
- Training loop:
-
  - Generate a batch for training:
-
  - Pick a number of bars back for input.
-
  - Pick a number of bars forward for calculating sharpe ratio
-
  - Use input and output in neural network.
-
  - Run one training step
-
  - Repeat until covergence
- Save model
