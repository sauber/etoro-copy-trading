Produce trading sell and buy signals.

Signal has a number of parameters, which can be optimized by backtesting.

Methods of a signal class:

´´´typescript
export() // Export current values from parameters
import() // Instance of class with imported values
default() // Instance of class with default values
random() // Instance of class with random values
generate() // Create a signal series from price serices
predict() // Signal from instrument at bar
´´´

Parameters are types from Backtest, with min, max and default values.

Values are the current numerical values from parameters.

Specific Signal class should be as simple as possible. It will have a method to generate indicators, which may be multiple related Series, and a method to summarize the indicators in to a series of signals into range [-1, 1];
