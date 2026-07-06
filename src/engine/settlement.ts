import { FRANCE } from '../config/france';

/**
 * Indemnités de remboursement anticipé à la revente :
 * min(6 mois d'intérêts sur le capital remboursé par anticipation,
 *     3 % du capital restant dû) — plafond légal (C. conso. R313-25).
 * Souvent négociées à zéro : `waived`.
 */
export function iraAmount(crd: number, annualLoanRate: number, waived: boolean): number {
  if (waived || crd <= 0) return 0;
  const sixMonthsInterest = crd * annualLoanRate * (FRANCE.iraMonthsOfInterest.value / 12);
  const crdCap = crd * FRANCE.iraCrdCapRate.value;
  return Math.min(sixMonthsInterest, crdCap);
}

/**
 * Valeur nette d'un portefeuille après PFU (flat tax 30 %) sur les gains,
 * les gains étant la valeur moins la base de coût (sommes versées).
 */
export function portfolioNetOfPfu(value: number, costBasis: number, pfuEnabled: boolean): number {
  if (!pfuEnabled) return value;
  const gains = Math.max(0, value - costBasis);
  return value - gains * FRANCE.pfuRate.value;
}
