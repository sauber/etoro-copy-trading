import { assertInstanceOf } from "@std/assert";
import { fetchjson } from "./fetch-json.ts";

Deno.test("Fetching", { ignore: true }, async () => {
  const data = await fetchjson("https://jsonplaceholder.typicode.com/todos/1");
  console.log(data);
  assertInstanceOf(data, Object);
});
