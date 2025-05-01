import { Optimizer } from "./optimizer.ts";

export class Minimize extends Optimizer {
  /** Direction for learning (-1 for minimize) */
  protected direction: number = -1;
}