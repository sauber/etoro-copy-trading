import { format } from "@std/datetime/format";

type MS = number;

export class ProgressBar {
  private readonly start = new Date().getTime();
  private readonly encoder = new TextEncoder();
  private counter = 0;

  constructor(private readonly title: string, public total: number) {}

  /** Calculate epoch ms for estimated eta */
  private eta(count: number): number {
    const now: MS = new Date().getTime();
    // how many ms since start
    const gone: MS = now - this.start;
    // Ratio of completion
    const ratio: MS = count / this.total;
    // how many ms remaining
    const remain: MS = gone / ratio - gone;
    const eta: MS = now + remain;
    return Math.round(eta);
  }

  /** Display estimated time of completion */
  private formatTime(ms: MS): string {
    return format(new Date(ms), "MM-dd HH:mm:ss");
  }

  /** Render current count and total */
  private formatCount(count: number): string {
    return `[${count}/${this.total}]`;
  }

  /** Render progress bar */
  private formatLine(count: number): string {
    const con: string = this.formatCount(count);
    const tim: string = this.formatTime(this.eta(count));
    return `${this.title} ${con} ETA ${tim}`;
  }

  /** Write progress bar to stdout */
  public async update(count: number): Promise<void> {
    if (count > 0) {
      const widgetText: string = this.formatLine(count);
      const text = `\r${widgetText}\x1b[?25l`;
      await Deno.stdout.write(this.encoder.encode(text));
    }
  }

  /** Write progress bar to stdout */
  public sync_update(count: number): void {
    if (count > 0) {
      const widgetText: string = this.formatLine(count);
      const text = `${widgetText}\x1b[?25l`;
      console.log(text);
    }
  }

  /** Increment counter by amount, and write progress bar */
  public inc(amount = 1): Promise<void> {
    this.counter += amount;
    return this.update(this.counter);
  }

  /** Reduce total count by amount, and write progress bar */
  public dec(amount = 1): Promise<void> {
    this.total -= amount;
    return this.update(this.counter);
  }

  /** Write newline */
  public async finish(): Promise<void> {
    await Deno.stdout.write(this.encoder.encode("\x1b[?25h\n"));
  }
}