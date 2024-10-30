import { CachingBackend, DiskBackend } from "📚/storage/mod.ts";
import { Community } from "📚/repository/mod.ts";
import { Ranking } from "📚/ranking/mod.ts";
import { Model } from "📚/ranking/model.ts";
import type { NetworkData } from "@sauber/neurons";

export class Backend {
  private readonly repo: CachingBackend;

  constructor(readonly diskpath: string) {
    const disk = new DiskBackend(diskpath);
    this.repo = new CachingBackend(disk);
  }

  public get community(): Community {
    return new Community(this.repo);
  }

  public async ranking(): Promise<Ranking> {
    const data = await this.repo.retrieve("ranking.network") as NetworkData;
    const model = Model.import(data);
    return new Ranking(model);
  }
}
