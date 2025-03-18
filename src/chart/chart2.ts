import { Buffer, Chart as ChartBase } from "@sauber/backtest";

export class Chart extends ChartBase {
  constructor(buffer: Buffer, end?: number) {
    super(buffer, end);
  }

  /** Trim leading similar values and values ending with 6000 */
  public get trim(): ChartBase {
    const buffer: Buffer = this.buffer;
    const length: number = buffer.length;

    // No trimming required
    if ( buffer[length-2] !== 6000 && buffer[1] !== buffer[0] ) return this;

    // Search for start
    let index: number = 0;
    while (buffer[index] === buffer[index+1]) index++;
    const start: number = index;

    // Search for end
    index = length-1;
    while (buffer[index] === 6000) index--;
    const end: number = index+2;

    const trimmed: Buffer = buffer.slice(start, end);
    return new Chart(trimmed, length-end);
  }

  
}