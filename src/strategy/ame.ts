function ame(currentGradient: number[], previousMoments: number[], beta1: number, beta2: number): number[] {

  // Initialize empty arrays for updated moments
  const moment1 = new Array(currentGradient.length).fill(0);
  const moment2 = new Array(currentGradient.length).fill(0);

  // Calculate exponential moving averages of gradients
  for (let i = 0; i < currentGradient.length; i++) {
    moment1[i] = beta1 * previousMoments[i] + (1 - beta1) * currentGradient[i];
    moment2[i] = beta2 * previousMoments[i] + (1 - beta2) * currentGradient[i] * currentGradient[i];
  }
  console.log({currentGradient, previousMoments, moment1, moment2});

  // Use bias corrected moments for direction and magnitude estimation
  const biasCorrectedMoment1 = moment1.map(val => val / (1 - Math.pow(beta1, 2)));
  const biasCorrectedMoment2 = moment2.map(val => val / (1 - Math.pow(beta2, 2)));

  // Normalize direction vector
  const direction = biasCorrectedMoment1.map(val => val / Math.sqrt(biasCorrectedMoment2.reduce((acc, sq) => acc + sq, 0)));

  return direction;
}

// Example gradient and previous moments
const gradient = [0.2, -0.1, 0.3];
const previousMoments = [0.1, 0.4, -0.2];

// Hyperparameters
const beta1 = 0.9;
const beta2 = 0.999;

// Calculate direction
const direction = ame(gradient, previousMoments, beta1, beta2);

console.log("Estimated direction:", direction);
