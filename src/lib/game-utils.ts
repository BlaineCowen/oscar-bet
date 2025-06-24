import oscarPredictions from "./oscars_predictions.json";

/**
 * Gets the nominee name from either name property or actor property
 */
export function getNomineeName(nominee: any): string {
  return nominee.actor || nominee.movie || nominee.name;
}

export function getNomineeMovie(nominee: any): string {
  return nominee.movie || "";
}

export function convertOddsToDecimal(odds: string): number {
  const [numerator, denominator] = odds.split("/").map(Number);
  return Math.round((1 + numerator / denominator) * 100) / 100;
}
