export { Asset } from "./asset.ts";
export { Backend } from "./backend.ts";
export { DiskBackend } from "./disk-backend.ts";
export { TempBackend } from "./temp-backend.ts";
export { HeapBackend } from "./heap-backend.ts";
export { CachingBackend } from "./caching-backend.ts";

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export type JSONObject = {
  [key: string]: JSONValue;
};

export type AssetName = string;
export type AssetNames = Array<AssetName>;
