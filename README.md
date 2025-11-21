# eToro Copy Trading

Download and analyze profiles of investors on eToro. Create strategies and run
simulation.

## Profiling

Define which script to run in deno.json. Then run profiling and analyse results.

```
deno task profile
node --prof-process isolate-*-v8.log | less
rm isolate-*-v8.log
```

Install less on Windows 11 Powershell

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
