import type { AmortizationSchedule, AssuranceMode } from './types';
import { crdAtMonth } from './amortization';

/**
 * Prime mensuelle d'assurance emprunteur au mois m (1-indexé).
 * - 'capitalInitial' : prime constante sur le capital emprunté (contrats
 *   groupe bancaires classiques).
 * - 'capitalRestantDu' : prime dégressive assise sur le CRD en début de mois
 *   (délégations d'assurance) — l'écart se chiffre en milliers d'euros sur 25 ans.
 * La prime s'éteint avec le prêt.
 */
export function assurancePremium(
  schedule: AmortizationSchedule,
  annualRate: number,
  mode: AssuranceMode,
  month: number,
): number {
  if (schedule.loan <= 0 || month < 1 || month > schedule.rows.length) return 0;
  const base = mode === 'capitalInitial' ? schedule.loan : crdAtMonth(schedule, month - 1);
  return (base * annualRate) / 12;
}
