import { Optimizer } from "./optimizer.ts";

/** Using Adam optimizer find combination of parameter values for highest output from agent */
export class Maximize extends Optimizer {
  /** Direction for learning (+1 for maximize) */
  protected direction: number = +1;
}
