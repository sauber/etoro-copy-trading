# Etoro-Fresh

Download and analyze profiles of investors

## Profiling

Define which script to run in deno.json. Then run profiling and analyse results.

```
deno task profile
node --prof-process isolate-*-v8.log | less
more profile.txt
rm profile.txt
rm isolate-*-v8.log
```

Install less on Windows 11 Powershell

```
Find-Package pscx | Install-Package -Force -scope currentuser -allowclobber
```
