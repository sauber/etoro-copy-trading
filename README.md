# eToro Copy Trading

Download and analyze profiles of investors on eToro. Create strategies and run
simulation.

## Install less on Windows 11 Powershell

```
Find-Package pscx | Install-Package -Force -scope currentuser -allowclobber
```

## Test data models

Just after checkout the ranking model is missing. To generate it

- In src/ranking/train.ts change bar_count to 15
- Run deno run src/ranking/train_bin.ts testdata
- In src/ranking/train.ts change bar_count back to 180

Generate the timing model:

- Run deno run src/optimize/optimize_bin.ts testdata
