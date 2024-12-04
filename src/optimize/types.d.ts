interface Optimizer {
  // Calculate update from gradient
  update: (grad: number) => number;
}