- In investor-assembly deal with charts ending with 6000
- In grid.ts module, square the displacement, to encourage shifting whole
  row/column instead of moving a single item far away. It's more important that
  relative rank is maintained, than absolute position.
- Change into one-liner:

```
const path: string = Deno.args[0];
const backend = new DiskBackend(path);
const repo = new CachingBackend(backend);
export const community = new Community(repo);
```

- Class files should not import modules from other directories. Import should
  only be from mod.ts
- Test files should not import modules or data from other directories Import
  should only be from testdata.ts
- Strategy, book and simulation should use same Portfolio module.
- Portfolio strategies and chart indicator strategies are not the same thing
- Replace chart with older implementation
- Detect NaN in machine learning input and output. If detected, the model is unusable.
- For machine learning, remove features the features that are have no variance or are the least correlated to output.
- Make progressbar an external module. Perhaps use from @sauber/ml-dashboard module.
- Discover Min/Max in config.json file
