import { Semaphore } from "semaphore";

export class RateLimit {
  private available: Date = new Date();
  private semaphore = new Semaphore(1);

  /** rate is number of milliseconds since start of previous call */
  constructor(private readonly rate: number) {}

  /** What for a period of time */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async limit<T>(callback: () => T): Promise<T> {
    return await this.semaphore.use(async () => {
      // How many ms until timeout
      const now: Date = new Date();
      const wait: number = this.available.getTime() - now.getTime();
      if (wait > 0) await this.delay(wait);

      // Next time to run
      const next = this.available.getTime() + this.rate;
      this.available = new Date(next);

      // Executing callback and return result
      return callback();
    });
  }
}
