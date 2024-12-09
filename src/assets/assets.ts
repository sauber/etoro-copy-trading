import {
  Backend,
  CachingBackend,
  DiskBackend,
  HeapBackend,
} from "📚/storage/mod.ts";
import { Community } from "📚/repository/mod.ts";
import { Config } from "📚/config/config.ts";
import { Ranking } from "📚/ranking/mod.ts";

export class Assets {
  public readonly config: Config;
  public readonly community: Community;
  public readonly ranking: Ranking;

  constructor(private readonly repo: Backend) {
    this.config = new Config(repo);
    this.community = new Community(repo);
    this.ranking = new Ranking(repo);
  }

  /** Create backend using disk repository */
  public static disk(diskpath: string): Assets {
    const disk = new DiskBackend(diskpath);
    const repo = new CachingBackend(disk);
    return new Assets(repo);
  }

  /** Create backend using heap */
  public static heap(): Assets {
    const repo = new HeapBackend();
    return new Assets(repo);
  }
}
