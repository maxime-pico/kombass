/**
 * Pure function to find the next alive step, skipping dead units.
 * Extracted from App.tsx changeStep for testability.
 */
export function findNextAliveStep(
  currentStep: number,
  direction: -1 | 1,
  unitLives: number[],
  unitsCount: number
): number {
  let nextStep = currentStep + direction;

  // Clamp to valid range [0, unitsCount]
  if (nextStep < 0) return currentStep;
  if (nextStep > unitsCount) return unitsCount;

  // Skip dead units in the given direction
  while (nextStep >= 0 && nextStep < unitsCount && unitLives[nextStep] <= 0) {
    nextStep += direction;
  }

  // Clamp again after skipping
  if (nextStep < 0) return currentStep;
  if (nextStep > unitsCount) return unitsCount;

  return nextStep;
}
