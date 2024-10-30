# Etoro-Fresh

Download and analyze profiles of investors

## Profiling

```
deno task profile
node --prof-process isolate-*-v8.log > profile.txt
more profile.txt
rm profile.txt
rm isolate-*-v8.log
```
