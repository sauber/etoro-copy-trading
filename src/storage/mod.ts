export { JournaledAsset } from "./journaled-asset.ts";
export { Asset } from "./asset.ts";
export { Backend } from "📚/storage/backend.ts";
export { DiskBackend } from "📚/storage/disk-backend.ts";
export { TempBackend } from "📚/storage/temp-backend.ts";
export { HeapBackend } from "📚/storage/heap-backend.ts";
export { CachingBackend } from "📚/storage/caching-backend.ts";

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
