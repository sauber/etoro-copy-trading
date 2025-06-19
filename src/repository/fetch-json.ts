import { JSONObject } from "../storage/mod.ts";

export function fetchjson(url: string): Promise<JSONObject> {
  console.log(url);

  return fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  }).then((resp) => resp.json());
}
