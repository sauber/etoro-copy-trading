import { Asset, CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import { Community } from "📚/repository/mod.ts";
import { Config } from "📚/config/config.ts";
import { NetworkData } from "@sauber/neurons";

// Asset names
const rankingAsset = "ranking.network";

export class Backend {
  private readonly repo: CachingBackend;
  public readonly config: Config;
  public readonly ranking: Asset<NetworkData>;

  constructor(readonly diskpath: string) {
    const disk = new DiskBackend(diskpath);
    this.repo = new CachingBackend(disk);
    this.config = new Config(this.repo);
    this.ranking = new Asset<NetworkData>(rankingAsset, this.repo);
  }

  public get community(): Community {
    return new Community(this.repo);
  }
}
