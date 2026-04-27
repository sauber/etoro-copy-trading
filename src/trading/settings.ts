import { Backend } from "@sauber/journal";
import { Config } from "📚/config/mod.ts";

export type Settings = Record<string, number>;

export const settings = async (repo: Backend): Promise<Settings> => {
  const config = new Config(repo);
  const settings = await config.get("trading") as Settings | null;
  if (!settings) throw new Error("Missing trading settings in repo");
  return settings;
};
