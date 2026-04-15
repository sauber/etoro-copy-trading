# eToro Copy Trading

## Purpose

This project provides an automated copy-trading system for eToro that enables
users to analyze successful investor profiles, replicate their strategies, and
simulate trading performance. It includes a ranking model to identify
top-performing investors based on statistical analysis.

## Project Structure

```
src/
├── account/          # Account management utilities
├── community/        # Community and social features
├── config/           # Configuration files and settings
├── indicator/        # Technical indicator implementations (WMA, EWO, HMA)
├── investor/         # Investor data processing
├── optimize/         # Optimization algorithms for model tuning
├── ranking/          # Neural network ranking system
├── refresh/          # Data fetching and refresh mechanisms
├── signal/           # Signal generation (including v8ichi)
├── strategy/         # Trading strategy implementations
├── tick/             # Timeline and tick data handling
└── trading/          # Core trading execution logic
```

## Setup Instructions

1. **Prerequisites**
   - Deno runtime (https://deno.land/)
   - Git for cloning the repository

2. **Install Dependencies**
   ```powershell
   Find-Package pscx | Install-Package -Force -scope currentuser -allowclobber
   ```

3. **Generate Ranking Model**
   - Temporarily modify `src/ranking/train.ts` to set `bar_count` to 15
   - Run the training binary: `deno run src/ranking/train_bin.ts testdata`
   - Restore `bar_count` to 180

4. **Generate Timing Model**
   - Run the optimizer: `deno run src/optimize/optimize_bin.ts testdata`

## Usage

- Analyze investor profiles stored in `testdata/`
- Use the ranking model to identify top investors
- Execute strategies via the `src/trading/` module
- Integrate signals from `src/signal/` for trade triggers

## Contributing

- Fork the repository
- Create a feature branch for your changes
- Write tests for new functionality
- Submit a pull request

## License

MIT License
