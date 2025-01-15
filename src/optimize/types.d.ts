import { Parameters } from "📚/optimize/parameter.ts";

interface Optimizer {
  // Calculate update from gradient
  update: (grad: number) => number;
}

export type Inputs = Array<number>;
export type Output = number;

/** Callback to Dashboard render function */
export type Status = (
  iteration: number,
  momentum: number,
  parameters: Parameters,
  loss: Array<Output>,
) => void;
