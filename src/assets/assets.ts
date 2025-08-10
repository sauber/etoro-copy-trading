import {
  Backend,
  CachingBackend,
  DiskBackend,
  HeapBackend,
} from "@sauber/journal";
import { Community, TestCommunity } from "📚/repository/mod.ts";
import { Config } from "📚/config/mod.ts";

export class Assets {
  public readonly config: Config;
  public readonly community: Community;
  public readonly testcommunity: TestCommunity;

  constructor(readonly repo: Backend) {
    this.config = new Config(repo);
    this.community = new Community(repo);
    this.testcommunity = new TestCommunity(repo);
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
