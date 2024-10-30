// Adapted from https://github.com/Tom-Alexander/regression-js/blob/master/src/regression.js

export type Point = [x: number, y: number];
type Coefficients = [a: number, b: number, c: number];

interface ParabolicResult {
  coefficients: Coefficients;
  peak: Point;
  predict: (x: number) => number;
}

/**
 * Determine the solution of a system of linear equations A * x = b using
 * Gaussian elimination.
 *
 * @param {Array<Array<number>>} input - A 2-d matrix of data in row-major form [ A | b ]
 *
 * @return {Array<number>} - Vector of normalized solution coefficients matrix (x)
 */
function gaussianElimination(matrix: Array<Array<number>>): Coefficients {
  const n = matrix.length - 1;
  const coefficients = Array<number>(3) as Coefficients;

  for (let i = 0; i < n; i++) {
    let maxrow = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(matrix[i][j]) > Math.abs(matrix[i][maxrow])) {
        maxrow = j;
      }
    }

    for (let k = i; k < n + 1; k++) {
      const tmp = matrix[k][i];
      matrix[k][i] = matrix[k][maxrow];
      matrix[k][maxrow] = tmp;
    }

    for (let j = i + 1; j < n; j++) {
      for (let k = n; k >= i; k--) {
        matrix[k][j] -= (matrix[k][i] * matrix[i][j]) / matrix[i][i];
      }
    }
  }

  for (let j = n - 1; j >= 0; j--) {
    let total = 0;
    for (let k = j + 1; k < n; k++) {
      total += matrix[k][j] * coefficients[k];
    }

    coefficients[j] = (matrix[n][j] - total) / matrix[j][j];
  }

  return coefficients;
}

/** Given a list of [x, y] pairs estimate best parabolic equation */
export function parabolic(
  data: Array<Point>,
): ParabolicResult {
  const lhs: Array<number> = [];
  const rhs: Array<Array<number>> = [];
  let a = 0;
  let b = 0;
  const len = data.length;
  const k = 3;

  for (let i = 0; i < k; i++) {
    for (let l = 0; l < len; l++) {
      if (data[l][1] !== null) a += (data[l][0] ** i) * data[l][1];
    }

    lhs.push(a);
    a = 0;

    const c = [];
    for (let j = 0; j < k; j++) {
      for (let l = 0; l < len; l++) {
        if (data[l][1] !== null) b += data[l][0] ** (i + j);
      }
      c.push(b);
      b = 0;
    }
    rhs.push(c);
  }
  rhs.push(lhs);

  const coefficients: Coefficients = gaussianElimination(rhs);

  const predict = (x: number) =>
    coefficients.reduce(
      (sum: number, coeff: number, power: number) =>
        sum + (coeff * (x ** power)),
      0,
    );

  // Calculate peak
  const peakX: number = -coefficients[1] / (2 * coefficients[2]);
  const peakY: number = predict(peakX);
  const peak: Point = [peakX, peakY];

  return {
    coefficients: [...coefficients].reverse() as Coefficients,
    peak,
    predict,
  };
}
