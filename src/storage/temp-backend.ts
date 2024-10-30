import { DiskBackend } from "./disk-backend.ts";
import { mktmpdir, rmdir } from "./files.ts";

export class TempBackend extends DiskBackend {
  constructor() {
    super("");
  }

  /** Created tmp dir */
  private _tmppath: string | null = null;
  protected override async path(): Promise<string> {
    if (!this._tmppath) this._tmppath = await mktmpdir();
    return this._tmppath;
  }

  /** Delete files if created */
  public override delete(): Promise<void> {
    if (this._tmppath) return rmdir(this._tmppath);
    else return Promise.resolve();
  }
}
