/** String where substrings can be plotted onto */
export class Line {
  /** Rendered string */
  public line: string;

  constructor(private readonly width: number, fill: string = " ") {
    this.line = new Array(width).fill(fill).join("");
  }

  /** Combine left section, label and right section */
  private insert(label: string, position: number): this {
    // Confirm label within line
    if (position < 0 || position + label.length > this.line.length) {
      throw new Error(`Invalid position: ${position}`);
    }

    this.line = this.line.substring(0, position) + label +
      this.line.substring(position + label.length, this.line.length);
    return this;
  }

  /** Label starting after position */
  public start(label: string, position: number = 0): this {
    return this.insert(label, position);
  }

  /** Label ending before position */
  public end(label: string, position: number = this.width): this {
    return this.insert(label, position - label.length);
  }

  /** Label centered at position */
  public center(
    label: string,
    position: number = Math.round(this.width / 2),
  ): this {
    return this.insert(label, position - Math.round(label.length / 2));
  }
}
